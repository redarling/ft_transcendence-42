from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.permissions import BasePermission
from django.conf import settings

class WebSocketTokenAuthentication(BaseAuthentication):
    def authenticate(self, request):
        websocket_token = request.headers.get("X-WebSocket-Token")
        if not websocket_token or websocket_token != settings.WEBSOCKET_API_TOKEN:
            raise AuthenticationFailed('Invalid or missing WebSocket token.')
        return (None, None)

class IsAuthenticatedWebSocket(BasePermission):
    def has_permission(self, request, view):
        websocket_token = request.headers.get("X-WebSocket-Token")
        return websocket_token == settings.WEBSOCKET_API_TOKEN

