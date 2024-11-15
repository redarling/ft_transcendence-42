from django.shortcuts import render
from rest_framework import viewsets
from rest_framework import status
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import UpdateAPIView, RetrieveAPIView, ListAPIView
from rest_framework.permissions import IsAuthenticated
from .models import User, UserStats, Friend
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserProfileSerializer, UserUpdateSerializer, UserStatsSerializer, FriendSerializer
import logging

logger = logging.getLogger(__name__)

class UserRegistrationAPIView(APIView):
    def post(self, request, *args, **kwargs):
        logger.debug("Request data: %s", request.data)
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({'message': 'User successfully registered.'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserLoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            user = authenticate(username=username, password=password)
            
            if user is not None:
                login(request, user)
                
                user.set_online()
                
                return Response({"message": "Login successful!"}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserLogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        user.set_offline()
        logout(request)
        return Response({"message": "Logout successful!"}, status=status.HTTP_200_OK)

class UserProfileAPIView(RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        return {'request': self.request}

    def get_object(self):
        user_id = self.kwargs.get('user_id', None)
        if user_id:
            return User.objects.get(id=user_id)
        return self.request.user


class UserSearchAPIView(ListAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        query = self.request.query_params.get('search', '')
        return User.objects.filter(username__icontains=query)

class UserUpdateAPIView(UpdateAPIView):
    serializer_class = UserUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class UserStatsAPIView(RetrieveAPIView):
    queryset = UserStats.objects.all()
    serializer_class = UserStatsSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user_id = self.kwargs.get('user_id', None)
        if user_id:
            user = User.objects.get(id=user_id)
            return user.stats
        return self.request.user.stats

class FriendshipAPIView(APIView):
    permission_classes = [IsAuthenticated]

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

class FriendListAPIView(ListAPIView):
    serializer_class = FriendSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Friend.objects.filter(user=user)

class FriendshipStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

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