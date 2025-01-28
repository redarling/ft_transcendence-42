from django.contrib.auth.backends import BaseBackend
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import User
from django.core.exceptions import ValidationError
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from .jwt_logic import decode_jwt

class UserAuthentication(BaseBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return None
        
        if user.check_password(password):
            if user.is_active:
                return user
            else:
                raise ValidationError("User account is disabled.")
        
        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

class AccessTokenAuthentication(BaseAuthentication):
    """
    Authentication class for access tokens.
    """
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
        
        try:
            try:
                token_type, token = auth_header.split(' ', 1)
            except ValueError:
                raise AuthenticationFailed('Invalid Authorization header format.')
            if token_type.lower() != 'bearer':
                raise AuthenticationFailed('Invalid token header format.')

            # Decode the JWT
            payload = decode_jwt(token)
            if payload.get("type") != "access":  # Ensure this is an access token
                raise AuthenticationFailed('Invalid token type.')

            # Fetch user from the token
            user = User.objects.get(id=payload["user_id"])

            if payload.get('session_id') != user.active_session_id:
                    raise AuthenticationFailed("Session is no longer active.")
            
            if not user.check_last_activity_key():
                raise AuthenticationFailed("Session has expired due to inactivity.")

            user.update_last_activity()
            
            return (user, None)
        except (ExpiredSignatureError, InvalidTokenError) as e:
            raise AuthenticationFailed(str(e))