from django.shortcuts import render
from datetime import datetime, timedelta
from django.conf import settings
from django.contrib.auth import authenticate
from rest_framework import viewsets
from rest_framework import status
from rest_framework import permissions
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.generics import UpdateAPIView, RetrieveAPIView, ListAPIView
from .models import User, UserStats, Friend, BlacklistedToken
from .serializers import UserRegistrationSerializer, UserLoginSerializer, \
    UserProfileSerializer, UserUpdateSerializer, UserStatsSerializer, FriendSerializer
import jwt
from .jwt_logic import generate_jwt, decode_jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

class UserRegistrationAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({'message': 'User successfully registered.'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    """
    Handles user authentication and returns JWT tokens upon success.
    """
    def post(self, request):
        # Extract username and password from the request
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"error": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Authenticate user
        user = authenticate(username=username, password=password)
        if not user:
            # Authentication failed
            return Response(
                {"error": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Access token (15 minutes)
        access_payload = {
            "user_id": user.id,
            "username": user.username,
            "type": "access"
        }
        access_token = generate_jwt(access_payload, expiration_minutes=15)  # 15 minutes
        
        # Refresh token (7 days)
        refresh_payload = {
            "user_id": user.id,
            "type": "refresh"
        }
        refresh_token = generate_jwt(refresh_payload, expiration_minutes=7 * 24 * 60)  # 7 days
        
        return Response(
            {
                "access_token": access_token,
                "refresh_token": refresh_token
            },
            status=status.HTTP_200_OK
        )
        user.set_online()
  
class UserTokenRefreshAPIView(APIView):
    permission_classes = [permissions.AllowAny]
    """
    Handles refreshing of JWT tokens.
    """
    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get('refresh_token')
        if not refresh_token:
            return Response(
                {"error": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            payload = decode_jwt(refresh_token)
            if payload.get("type") != "refresh":
                return Response(
                    {"error": "Invalid token type."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Generate new access token
            access_payload = {
                "user_id": payload["user_id"],
                "username": payload.get("username", ""),
                "type": "access"
            }
            access_token = generate_jwt(access_payload, expiration_minutes=15)  # 15 minutes
            
            return Response(
                {"access_token": access_token},
                status=status.HTTP_200_OK
            )
        except ExpiredSignatureError:
            return Response(
                {"error": "Refresh token has expired."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except InvalidTokenError:
            return Response(
                {"error": "Invalid refresh token."},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserLogoutAPIView(APIView):
    def post(self, request):
        auth_header = request.headers.get('Authorization')

        if not auth_header:
            return Response({"error": "Token is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token_type, token = auth_header.split(' ')
            if token_type.lower() != 'bearer':
                raise AuthenticationFailed("Invalid token header format.")

            user = request.user
            user.set_offline()
            BlacklistedToken.objects.create(token=token)
            # TODO: Refresh token should be invalidated as well
            # TODO: Delete some of the older tokens from the blacklist

            return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)

        except Exception as e:
            raise AuthenticationFailed("Invalid token.")

class UserProfileAPIView(RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer

    def get_serializer_context(self):
        return {'request': self.request}

    def get_object(self):
        user_id = self.kwargs.get('user_id', None)
        if user_id:
            return User.objects.get(id=user_id)
        return self.request.user

# TODO: It searches not correctly, fix it
class UserSearchAPIView(ListAPIView):
    serializer_class = UserProfileSerializer

    def get_queryset(self):
        query = self.request.query_params.get('search', '')
        return User.objects.filter(username__icontains=query)

# TODO: never tested
class UserUpdateAPIView(UpdateAPIView):
    serializer_class = UserUpdateSerializer

    def get_object(self):
        return self.request.user

# TODO: never tested
class UserStatsAPIView(RetrieveAPIView):
    queryset = UserStats.objects.all()
    serializer_class = UserStatsSerializer

    def get_object(self):
        user_id = self.kwargs.get('user_id', None)
        if user_id:
            user = User.objects.get(id=user_id)
            return user.stats
        return self.request.user.stats

# TODO: never tested
class FriendshipAPIView(APIView):
    def post(self, request, *args, **kwargs):
        user = request.user
        friend_id = request.data.get('friend_id')
        try:
            friend = User.objects.get(id=friend_id)
        except User.DoesNotExist:
            return Response({'error': 'Friend not found'}, status=status.HTTP_400_BAD_REQUEST)
        
        friendship, created = Friend.add_friend(user, friend)
        if not created:
            return Response({'message': 'Friendship already exists or pending.'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'message': 'Friendship request sent.'}, status=status.HTTP_201_CREATED)

    def delete(self, request, *args, **kwargs):
        user = request.user
        friend_id = request.data.get('friend_id')
        try:
            friend = User.objects.get(id=friend_id)
        except User.DoesNotExist:
            return Response({'error': 'Friend not found'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            friendship = Friend.objects.get(user=user, friend=friend)
            friendship.delete()
            return Response({'message': 'Friendship deleted.'}, status=status.HTTP_204_NO_CONTENT)
        except Friend.DoesNotExist:
            return Response({'error': 'Friendship does not exist.'}, status=status.HTTP_400_BAD_REQUEST)

# TODO: never tested
class FriendListAPIView(ListAPIView):
    serializer_class = FriendSerializer

    def get_queryset(self):
        user = self.request.user
        return Friend.objects.filter(user=user)

# TODO: never tested
class FriendshipStatusAPIView(APIView):
    def post(self, request, *args, **kwargs):
        user = request.user
        friend_id = request.data.get('friend_id')
        action = request.data.get('action')  # 'accept' or 'decline'
        
        try:
            friend = User.objects.get(id=friend_id)
        except User.DoesNotExist:
            return Response({'error': 'Friend not found'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            friendship = Friend.objects.get(user=user, friend=friend)
        except Friend.DoesNotExist:
            return Response({'error': 'Friendship request not found'}, status=status.HTTP_400_BAD_REQUEST)
        
        if action == 'accept':
            friendship.accept_friend()
            return Response({'message': 'Friendship accepted.'}, status=status.HTTP_200_OK)
        elif action == 'decline':
            friendship.decline_friend()
            return Response({'message': 'Friendship declined.'}, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)