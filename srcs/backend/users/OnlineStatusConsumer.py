import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
import logging

logger = logging.getLogger(__name__)

class OnlineStatusConsumer(AsyncWebsocketConsumer):
    """
    Consumer for handling WebSocket connections and user statuses with ping-pong logic.
    """
    async def connect(self):
        logger.info("User connected: %s", self.scope["user"])
        self.user = self.scope.get("user")
        if not self.user or isinstance(self.user, AnonymousUser):
            # Close the connection if the user is anonymous (token isn't provided or is invalid)
            await self.close()
            return

        await self.set_user_online()
        self.ping_task = asyncio.create_task(self.ping_client())  # Start the ping-pong mechanism
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "ping_task"):
            self.ping_task.cancel()  # Stop the ping mechanism
            logger.info("Ping task cancelled for user: %s", self.user.username)
        if hasattr(self, "user") and not isinstance(self.user, AnonymousUser):
            await self.set_user_offline()
            logger.info("User set offline: %s", self.user.username)

    async def receive(self, text_data):
        """
        Handle incoming messages from the client.
        """
        try:
            data = json.loads(text_data)
            if data.get("type") == "pong":
                self.last_pong_received = True  # Mark that a pong was received
                await self.update_last_activity()
        except json.JSONDecodeError:
            pass

    async def ping_client(self):
        """
        Periodically send ping messages, check for pong responses
        """
        try:
            self.last_pong_received = True
            while True:
                if not self.last_pong_received:
                    logger.info("Pong not received. Marking user offline: %s", self.user.username)
                    await self.set_user_offline()
                    await self.close()
                    break

                self.last_pong_received = False
                await self.send(json.dumps({"type": "ping"}))

                # Wait for pong response within a timeout period
                await asyncio.sleep(10)

                # After 10 seconds, check if pong was received
                if self.last_pong_received:
                    # If pong received, continue the ping-pong cycle
                    continue
                else:
                    # No pong received, mark user as offline and close the connection
                    logger.info(f"Pong not received after 10 seconds for user: {self.user.username}. Closing WebSocket.")
                    await self.set_user_offline()  # Set user status to offline
                    await self.close()  # Close the connection
                    break

        except asyncio.CancelledError:
            # Handle the case where the ping task is cancelled during disconnect
            logger.info("Ping loop cancelled for user: %s", self.user.username)

    @database_sync_to_async
    def set_user_online(self):
        """
        Set the user's online status to True.
        """
        if self.user and not isinstance(self.user, AnonymousUser):
            self.user.set_online()

    @database_sync_to_async
    def set_user_offline(self):
        """
        Set the user's online status to False.
        """
        if self.user and not isinstance(self.user, AnonymousUser):
            self.user.set_offline()

    @database_sync_to_async
    def update_last_activity(self):
        """
        Update the user's last activity time.
        """
        if self.user and not isinstance(self.user, AnonymousUser):
            self.user.update_last_activity()