from django.utils.timezone import now
from urllib.parse import parse_qs
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from django.contrib.auth.models import AnonymousUser
from channels.middleware import BaseMiddleware
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from .models import User
from channels.db import database_sync_to_async
from .jwt_logic import decode_jwt

class TokenAuthMiddleware(BaseMiddleware):
    """
    Middleware for authentication via JWT token in WebSocket.
    """
    async def __call__(self, scope, receive, send):
        query_string = parse_qs(scope["query_string"].decode())
        token = query_string.get("token", [None])[0]

        if token:
            try:
                decoded_payload = decode_jwt(token)
                user_id = decoded_payload.get("user_id")
                if user_id:
                    user = await database_sync_to_async(User.objects.get)(id=user_id)
                    scope["user"] = user
                else:
                    scope["user"] = AnonymousUser()
            except (ExpiredSignatureError, InvalidTokenError):
                scope["user"] = AnonymousUser()
        else:
            scope["user"] = AnonymousUser()

        return await super().__call__(scope, receive, send)

class UpdateLastActivityMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if request.user.is_authenticated:
            request.user.last_activity = now()
            request.user.save(update_fields=["last_activity"])

        return response

class OnlineStatusMiddleware(MiddlewareMixin): #dosent work
    """
    Middleware to check if a user is online and prevent HTTP actions from inactive users
    """

    EXEMPT_PATHS = [
        '/api/users/login/',
        '/api/users/register/',
        '/api/users/refresh-token/',
    ]

    def process_request(self, request):
        if request.path in self.EXEMPT_PATHS:
            return None

        user = request.user
        if isinstance(user, AnonymousUser):
            return None

        if not user.is_online:
            return JsonResponse(
                {"detail": "User is not online. Please reconnect to the WebSocket."},
                status=403
            )
        return None

