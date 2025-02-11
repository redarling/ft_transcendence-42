from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import AnonymousUser
from .channel_handling import send_group_message
from .utils import (check_active_match, is_participant, get_tournament_data, get_tournament_participants)
from .tournament_handler import TournamentHandler
from .match_event_queue import MatchEventQueueManager
import json, logging, asyncio

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
        
        logger.info("User connected (id: %s) to tournament %s", str(self.user.id), self.tournament_id)
        
        self.group_name = f"tournament_{self.tournament_id}"
        self.user_group_name = f"player_{self.user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.channel_layer.group_add(self.user_group_name, self.channel_name)
        participants, title, description, self.is_admin, self.status = await get_tournament_data(self.tournament_id, self.user.id)
        
        await self.send(json.dumps(
            {
                "event": "tournament_data",
                "title": title,
                "description": description,
                "is_admin": self.is_admin
            }))
        
        # TODO: change to send_group_message
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
        if hasattr(self, "user_group_name"):
            await self.channel_layer.group_discard(self.user_group_name, self.channel_name)

    async def receive(self, text_data):
        """
        Handle incoming messages from the client.
        """
        data = json.loads(text_data)
        event = data.get("event")
        
        if event == "tournament_cancelled":
            logger.info("Cancelling tournament %s", id)
            await send_group_message(f"tournament_{self.tournament_id}", {"event": "tournament_cancelled"})
            await self.channel_layer.group_send(
            f"tournament_{self.tournament_id}",
            {
                "type": "disconnect_message",
            },
        )
            
        elif event == "user_left":
            await self.channel_layer.group_send(
            f"tournament_{self.tournament_id}",
            {
                "type": "userleft_message",
                "user_id": self.user.id,
                "username": self.user.username,
            },
            )
        
        elif event == "tournament_start":
            """
            Start the tournament logic.
            """
            if not self.is_admin or self.status not in ["pending", "Pending"]:
                logger.info("Tournament starting cancelled. Access forbidden")
                return

            logger.info("Starting tournament %s", self.tournament_id)
            tournament_handler = TournamentHandler(self.tournament_id, self.group_name)
            asyncio.create_task(tournament_handler.handle_tournament())
        
        elif event == "ready":
            match_id = data.get("matchId")
            if match_id:
                match_group = f"match_{match_id}"
                self.eventQueue = MatchEventQueueManager.get_queue(match_group)
                await self.eventQueue.put({
                "event": "player_ready",
                "playerId": self.user.id,
                "matchId": match_id,
                })
            else:
                logger.error("Invalid ready signal: missing matchId")

        elif event == "player_action":
            direction = data.get("direction")
            if not self.eventQueue:
                self.eventQueue = MatchEventQueueManager.get_queue(self.match_group)
            await self.eventQueue.put({
                "event": "player_action",
                "player_id": str(self.user.id),
                "direction": direction,
            })
          
        else:
            await self.send_json_message("error", "Invalid event")

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
            self.match_group = match_group
            await self.channel_layer.group_add(match_group, self.channel_name)
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

    async def userleft_message(self, event):
        user_id = event.get("user_id")
        username = event.get("username")
        if user_id == self.user.id:
            await self.close()
        else:
            await self.send_json_message("user_left", username)
            participants = await get_tournament_participants(self.tournament_id) 
            await self.send(json.dumps({
                    "event": "participant_list",
                    "participants": participants,
                },
            ))

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
        await self.send(text_data=json.dumps({"event": "participant_list", "participants": event["participants"]}))