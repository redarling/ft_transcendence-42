from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from .api_calls import create_match_api
from .channel_handling import remove_player_from_group, send_group_message, disconnect_user, send_error_to_players, add_player_to_group
from .utils import check_active_match, is_player_online, check_players_online_statuses, is_participant, get_tournament_data
from .match_handler import MatchHandler
from .recovery_key_manager import RecoveryKeyManager
from .match_event_queue import MatchEventQueueManager
import json
import logging
import asyncio

logger = logging.getLogger(__name__)

class TournamentConsumer(AsyncWebsocketConsumer):
    
    async def connect(self):
        """
        Handle authenticated connection.
        Check if the user is a participant of the tournament.
        """
        self.tournament_id = self.scope["url_route"]["kwargs"]["tournament_id"]
        self.user = self.scope.get("user")

        if not self.user or isinstance(self.user, AnonymousUser):
            await self.close()
            return

        if not await is_participant(self.tournament_id, self.user):
            await self.close()
            return
        
        await self.accept()

        logger.info("User connected: %s; user id: %s to tournament %s", self.user, str(self.user.id), self.tournament_id)

        self.group_name = f"tournament_{self.tournament_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)

        participants, title, description, is_admin = await get_tournament_data(self.tournament_id, self.user.id)

        await self.send(json.dumps(
            {
                "event": "tournament_data",
                "title": title,
                "description": description,
                "is_admin": is_admin
            }))
        
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "participant_update",
                "participants": participants,
            },
        )

    async def disconnect(self, close_code):
        """
        Handle disconnection.
        """
        logger.info("Disconnection: %s", self.scope["user"])

        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        """
        Handle incoming messages from the client.
        """
        data = json.loads(text_data)
        event = data.get("event")
        
        if event == "player_action":
            direction = data.get("direction")
            #if not self.eventQueue:
            #    self.eventQueue = MatchEventQueueManager.get_queue(self.match_group)
            #await self.eventQueue.put({
            #    "event": "player_action",
            #    "player_id": self.player_id,
            #    "direction": direction,
            #})

        elif event == "recover_match":
            logger.info("Recovering match %s", data)
            #match_group = data.get("matchGroup")
            #await self.recover_match(match_group)
        
        elif event == "tournament_cancelled":
            id = data.get("tournament_id")
            logger.info("Cancelling tournament %s", id)
            
            await send_group_message(f"tournament_{self.tournament_id}", {"event": "tournament_cancelled"})

            await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "disconnect_message",
            },
        )
        
        else:
            await self.send_json_message("error", "Invalid event")

    async def recover_match(self, match_group):
        """
        Recover a match using a recovery key.
        """
        #self.player_id = str(self.user.id)
        
        #match_data = await RecoveryKeyManager.get_recovery_key(match_group)
        #if match_data and (self.player_id == match_data["player1_id"] or self.player_id == match_data["player2_id"]):
        #    self.match_group = match_group
        #    logger.info(f"User {self.user.id} recovered match {match_group}")
        #    await self.send(json.dumps({
        #        "event": "match_recovered",
        #        "player1_id": match_data["player1_id"],
        #        "player2_id": match_data["player2_id"],
        #        "player1_username": match_data["player1_username"],
        #        "player2_username": match_data["player2_username"],
        #        "player1_avatar": match_data["player1_avatar"],
        #        "player2_avatar": match_data["player2_avatar"],
        #        'opponent_username': match_data["player2_username"] if str(self.player_id) == match_data["player1_id"] else match_data["player1_username"],
        #    }))
        #    await self.channel_layer.group_add(match_group, self.channel_name)

        #else:
        #    logger.warning(f"User {self.user.id} failed to recover match {match_group}")
        #    await self.send_json_message("error", "Failed to recover match")
        #    await disconnect_user(self.player_id)

    async def start_match(self, player1, player2):
        """
        Initialize the match and start the handler.
        """
        try:
            logger.info("Starting match: %s vs %s", player1, player2)
            match_data = await create_match_api(player1, player2, match_type="1v1")

            self.match_group = f"match_{match_data['id']}"
            self.eventQueue = MatchEventQueueManager.get_queue(self.match_group)
            
            await add_player_to_group(player1, self.match_group, match_data)
            await add_player_to_group(player2, self.match_group, match_data)

            await RecoveryKeyManager.create_recovery_key(self.match_group, player1, match_data['player1_username'], 
                                                         player2, match_data['player2_username'], 
                                                         match_data['player1_avatar'], match_data['player2_avatar'])

            match_handler = MatchHandler(player1, player2, self.match_group, match_data, self.eventQueue)
            asyncio.create_task(match_handler.start_match())
            asyncio.create_task(check_players_online_statuses(player1, player2, self.eventQueue, self.match_group))
        
        except Exception as e:
            await send_error_to_players(player1, player2, "Failed to start the match. Please try again.")
            logger.error(f"Error during match handling: {e}")
            await disconnect_user(player1)
            await disconnect_user(player2)

##################################################################################################
#                                   UTILS                                                        #
##################################################################################################

    async def send_json_message(self, event, message=None):
        """
        Send a JSON message to the WebSocket.
        """
        if message:
            await self.send(json.dumps({"event": event, "message": message}))
        else:
            await self.send(json.dumps({"event": event}))

    async def matchchannel_message(self, event):
        """
        Handles a message sent to the player's channel to join a match_group.
        """
        match_group = event.get("match_group")
        match_data = event.get("match_data")
        if match_group and match_data:
            if not self.match_group:
                self.match_group = match_group
            await self.channel_layer.group_add(match_group, self.channel_name)
            
            logger.info("User %s added to match channel group %s", self.user, match_group)
            await self.send(json.dumps(
                {
                "event": "match_start",
                "match_data": match_data,
            }))
        else:
            logger.error("Error during adding user to match group: No match group or match data")
            self.close()

    async def disconnect_message(self, event):
        await self.close()

    async def websocket_message(self, event):
        """
        Handle messages sent to the WebSocket from the group.
        """
        message = event.get("message")

        await self.send(text_data=json.dumps(message))

    async def participant_update(self, event):
        """
        Handle participant updates and send to all users.
        """
        await self.send(
            text_data=json.dumps({
                "event": "participant_list",
                "participants": event["participants"],
            })
        )