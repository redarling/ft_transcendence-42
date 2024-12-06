import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from .models import User

class OnlineStatusConsumer(AsyncWebsocketConsumer):
    """
    Consumer for handling WebSocket connections and user statuses.
    """

    async def connect(self):
        self.user = self.scope.get("user")
        if not self.user or isinstance(self.user, AnonymousUser):
            # Close the connection if the user is anonymous (token isn't provided or is invalid)
            await self.close()
            return
        await self.set_user_online()
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "user") and not isinstance(self.user, AnonymousUser):
            await self.set_user_offline()

    async def receive(self, text_data):
        """
        Handle incoming messages from the client.
        """
        try:
            data = json.loads(text_data)
            if data.get("type") == "pong":
                await self.update_last_activity()
        except json.JSONDecodeError:
            # Ignore incorrect messages
            pass

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
