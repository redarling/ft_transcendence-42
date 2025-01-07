from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from .queue import MatchmakingQueue
from users.models import User
from .api_calls import create_match_api
from .channel_messages import remove_player_from_group, send_group_message
from .match_handler import MatchHandler
import json
import logging
import asyncio

logger = logging.getLogger(__name__)

class MatchmakingConsumer(AsyncWebsocketConsumer):
    queue = MatchmakingQueue()
    eventQueue = asyncio.Queue()

    async def connect(self):
        """
        Handle authenticated connection.
        Close the connection if the user is anonymous (token isn't provided or is invalid)
        """
        self.user = self.scope.get("user")
        if not self.user or isinstance(self.user, AnonymousUser):
            await self.close()
            return
        logger.info("User connected: %s; user id: %s", self.user, str(self.user.id))
        await self.accept()
        try:
            await self.channel_layer.group_add(f"player_{self.user.id}", self.channel_name)
        except Exception as e:
            logger.error(f"Failed to add user {self.user} to group: {e}")
            await self.close()
            return
        self.player_id = None
        self.match_channel = None

    # TODO: rework it after redis recovery key implementation
    async def disconnect(self, close_code):
        """Handle client disconnection."""
        if hasattr(self, 'eventQueue'):
            while not self.eventQueue.empty():
                await self.eventQueue.get()
        if hasattr(self, "player_id") and self.player_id and not isinstance(self.user, AnonymousUser):
            self.queue.remove_player(self.player_id)
            logger.info("User stopped matchmaking: %s", self.scope["user"])
            await self.channel_layer.group_discard(f"player_{self.user.id}", self.channel_name)
            if self.match_channel:
                try:
                    # TODO: Rework
                    await send_group_message(self.match_channel, {"event": "error", "message": "User disconnected"})
                    await remove_player_from_group(self.match_channel, f"player_{self.user.id}")
                except AttributeError:
                    pass

    async def receive(self, text_data):
        """
        Handle incoming messages from the client.
        """
        data = json.loads(text_data)
        event = data.get("event")
        
        if event == "start_search":
            # Start searching for a match
            if self.player_id:
                # Prevent duplicate entries
                await self.send(json.dumps({"event": "error", "message": "Already in matchmaking"}))
                return
            if self.queue.is_player_in_queue(str(self.user.id)):
                # Handle case where the player is already in the queue
                await self.send(json.dumps({"event": "error", "message": "You are already in the queue"}))
                return
            self.player_id = str(self.user.id)  # Use authenticated user's ID
            await self.send(json.dumps({"event": "player_id", "message": self.player_id}))
            self.queue.add_player(self.player_id)
            logger.info("User started matchmaking: %s", self.user.id)
            await self.find_match()
        
        elif event == "cancel_search":
            if self.player_id:
                self.queue.remove_player(self.player_id)
                self.player_id = None  # Reset player ID after cancellation
                await self.send(json.dumps({"event": "search_cancelled"}))
            else:
                await self.send(json.dumps({"event": "error", "message": "Not in matchmaking"}))
        
        elif event == "player_action":
            # Get player action information
            player_id = data.get("playerId")
            direction = data.get("direction")
            await self.eventQueue.put({
                "event": "player_action",
                "player_id": player_id,
                "direction": direction,
            })
        
        else:
            await self.send(json.dumps({"event": "error", "message": "Invalid event"}))

    async def find_match(self):
        match = self.queue.get_next_match()
        if match:
            player1, player2 = match
            player1_online = await self.is_player_online(player1)
            player2_online = await self.is_player_online(player2)

            if player1_online and player2_online:
                logger.info("Starting match: %s vs %s", player1, player2)
                await self.start_match(player1, player2)
            else:
                logger.error("Match canceled. Re-adding online player to the queue.")

                # Re-add online players to the queue
                if self.player_id == str(player1): 
                    player1, player2 = player2, player1
                
                if player1_online:
                    self.queue.add_player(player1)
                else:
                    logger.info("Player %s is offline. Closing connection.", player1)
                    await self.disconnect_user(player1)
                
                if player2_online:
                    self.queue.add_player(player2)
                else:
                    logger.info("Player %s is offline. Closing connection.", player2)
                    await self.disconnect_user(player2)

                await self.send(json.dumps({"event": "searching"}))
        else:
                await self.send(json.dumps({"event": "searching"}))

    async def start_match(self, player1, player2):
        """Initialize the match and start the handler."""
        try:
            # Create a match using the API
            match_data = await create_match_api(player1, player2, match_type="1v1")
            
            match_channel = f"match_{match_data['id']}"
            await self.create_match_channel(player1, player2, match_channel)
            
            # TODO: add redis recovery key, finish properly game (remove from channel, etc)
            match_handler = MatchHandler(player1, player2, match_channel, match_data, self.eventQueue)
            asyncio.create_task(match_handler.start_match())
            asyncio.create_task(self.check_players_online_statuses(player1, player2))
        
        except Exception as e:
            await self.send_error_to_players(player1, player2, str(e))
            logger.error(f"Error during match handling: {e}")
            self.disconnect_user(player1)
            self.disconnect_user(player2)

################################### UTILS ########################################################
    
    async def send_error_to_players(self, player1, player2, error_message):
        """
        Notify players about an error during match creation.
        """
        for player in [player1, player2]:
            await self.channel_layer.group_send(
                f"player_{player}",
                {
                    "type": "websocket.message",
                    "message": {"event": "error", "message": error_message},
                },
            )

    async def create_match_channel(self, player1, player2, match_channel):
        """
        Create a channel group for the match and add players.
        """
        try:
            await self.channel_layer.group_add(match_channel, self.channel_name)
            await self.add_player_to_group(player1, match_channel)
            await self.add_player_to_group(player2, match_channel)
        
        except Exception as e:
            logger.error(f"Error adding players to match group {match_channel}: {e}")
            self.disconnect_user(player1)
            self.disconnect_user(player2)

    async def add_player_to_group(self, user_id, match_channel):
        """
        Adds a player to a match channel group.
        """
        self.match_channel = match_channel
        await self.channel_layer.group_send(
            f"player_{user_id}",
            {
                "type": "matchchannel.message",
                "match_channel": match_channel,
            },
        )

    async def matchchannel_message(self, event):
        """
        Handles a message sent to the player's channel to join a match channel.
        """
        match_channel = event.get("match_channel")
        if match_channel:
            await self.channel_layer.group_add(match_channel, self.channel_name)
            logger.info("User %s added to match channel %s", self.user, match_channel)
        else:
            logger.error("Match channel not specified in event: %s", event)

    async def disconnect_user(self, user_id):
        await self.channel_layer.group_send(
            f"player_{user_id}",
            {
                "type": "disconnect.message",
            },
        )

    async def disconnect_message(self, event):
        if self.user and hasattr(self.user, "id"):
            await self.channel_layer.group_discard(f"player_{self.user.id}", self.channel_name)
        await self.close()

    async def websocket_message(self, event):
        """
        Handle messages sent to the WebSocket from the group.
        """
        message = event.get("message")

        await self.send(text_data=json.dumps(message))
    
    @database_sync_to_async
    def is_player_online(self, player_id):
        """
        Check if a player is online.
        """
        try:
            user = User.objects.get(id=player_id)
            return user.online_status
        except User.DoesNotExist:
            return False
        
    async def check_players_online_statuses(self, player_id_1, player_id_2):
        """
        Check if players are still online.
        """
        while True:

            # TODO: check if redis recovery key is still active, if not then break

            player_1_online = await self.is_player_online(player_id_1)
            if not player_1_online:
                await self.eventQueue.put({
                    "event": "player_disconnected",
                    "player_id": player_id_1
                })
                break
            
            player_2_online = await self.is_player_online(player_id_2)
            if not player_2_online:
                await self.eventQueue.put({
                    "event": "player_disconnected",
                    "player_id": player_id_2
                })
                break
            await asyncio.sleep(10)

