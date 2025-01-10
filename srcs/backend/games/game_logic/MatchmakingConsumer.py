from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from .queue import MatchmakingQueue
from users.models import User
from .api_calls import create_match_api
from .channel_messages import remove_player_from_group, send_group_message
from .match_handler import MatchHandler
from .recovery_key_manager import RecoveryKeyManager
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
        self.match_group = None

    # TODO: rework it after redis recovery key implementation
    async def disconnect(self, close_code):
        """
        Handle client disconnection.
        """
        if hasattr(self, 'eventQueue'):
            while not self.eventQueue.empty():
                await self.eventQueue.get()
        if hasattr(self, "player_id") and self.player_id and not isinstance(self.user, AnonymousUser):
            self.queue.remove_player(self.player_id)
            logger.info("User stopped matchmaking: %s", self.scope["user"])
            await self.channel_layer.group_discard(f"player_{self.user.id}", self.channel_name)
            if self.match_group:
                # TODO: Rework
                await send_group_message(self.match_group, {"event": "error", "message": "User disconnected"})
                await remove_player_from_group(self.match_group, f"player_{self.user.id}")

    async def receive(self, text_data):
        """
        Handle incoming messages from the client.
        """
        data = json.loads(text_data)
        event = data.get("event")
        
        if event == "start_search":
            if self.player_id:
                # Prevent duplicate entries
                await self.send(json.dumps({"event": "error", "message": "Already in matchmaking"}))
                return
            if self.queue.is_player_in_queue(str(self.user.id)):
                await self.send(json.dumps({"event": "error", "message": "You are already in the queue"}))
                return
            self.player_id = str(self.user.id)
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
            player_id = data.get("playerId")
            direction = data.get("direction")
            await self.eventQueue.put({
                "event": "player_action",
                "player_id": player_id,
                "direction": direction,
            })

        elif event == "recover_match":
            logger.info("Recovering match %s", data)
            match_group = data.get("matchGroup")
            await self.recover_match(match_group)

        else:
            await self.send(json.dumps({"event": "error", "message": "Invalid event"}))

    async def recover_match(self, match_group):
        """
        Recover a match using a recovery key.
        """
        player_id = str(self.user.id)

        logger.info(f"User {player_id} is trying to recover match {match_group}")
        match_data = await RecoveryKeyManager.get_recovery_key(match_group)
        if match_data and (player_id == match_data["player1_id"] or player_id == match_data["player2_id"]):
            self.match_group = match_group
            logger.info(f"User {self.user.id} recovered match {match_group}")
            await self.send(json.dumps({
                "event": "match_recovered",
                "player1_id": match_data["player1_id"],
                "player2_id": match_data["player2_id"],
                "player1_username": match_data["player1_username"],
                "player2_username": match_data["player2_username"],
                'opponent_username': match_data["player2_username"] if str(player_id) == match_data["player1_id"] else match_data["player1_username"],
            }))
            #await self.add_player_to_group(player_id, match_group)
            await self.channel_layer.group_add(match_group, self.channel_name)
            logger.info(f"User {self.user.id} reconnected to match {match_group}")

        else:
            logger.warning(f"User {self.user.id} failed to recover match {match_group}")
            await self.send(json.dumps({"event": "error", "message": "Failed to recover match"}))
            self.disconnect_user(player_id)

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
            match_data = await create_match_api(player1, player2, match_type="1v1")
            logger.info(f"Match created: {match_data}")

            match_group = f"match_{match_data['id']}"
            await self.create_match_group(player1, player2, match_group)
            
            await RecoveryKeyManager.create_recovery_key(match_group, player1, match_data['player1_username'], player2, match_data['player2_username'])

            match_handler = MatchHandler(player1, player2, match_group, match_data, self.eventQueue)
            asyncio.create_task(match_handler.start_match())
            asyncio.create_task(self.check_players_online_statuses(player1, player2))
        
        except Exception as e:
            await self.send_error_to_players(player1, player2, "Failed to start the match. Please try again.")
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

    async def create_match_group(self, player1, player2, match_group):
        """
        Create a channel group for the match and add players.
        """
        try:
            await self.channel_layer.group_add(match_group, self.channel_name)
            await self.add_player_to_group(player1, match_group)
            await self.add_player_to_group(player2, match_group)
        
        except Exception as e:
            logger.error(f"Error adding players to match group {match_group}: {e}")
            self.disconnect_user(player1)
            self.disconnect_user(player2)

    async def add_player_to_group(self, user_id, match_group):
        """
        Adds a player to a match channel group.
        """
        self.match_group = match_group
        await self.channel_layer.group_send(
            f"player_{user_id}",
            {
                "type": "matchchannel.message",
                "match_group": match_group,
            },
        )

    async def matchchannel_message(self, event):
        """
        Handles a message sent to the player's channel to join a match_group.
        """
        match_group = event.get("match_group")
        if match_group:
            await self.channel_layer.group_add(match_group, self.channel_name)
            logger.info("User %s added to match channel %s", self.user, match_group)
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

