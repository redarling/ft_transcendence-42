from django.db import models
from django.db.models import Q
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
#from rest_framework.views import APIView
#from rest_framework.generics import UpdateAPIView, RetrieveAPIView, ListAPIView
from .models import Tournament, MatchHistory, MatchPlayerStats, TournamentParticipant, Round, Match
from users.models import User, Friend, UserStats
#from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from django.utils import timezone
from datetime import timedelta
#from .serializers import 

class MatchHistoryAPIView(APIView):

    def post(self, request):
        return Response({'error': 'Stay tuned... It doesnt work yet'}, status=status.HTTP_403_FORBIDDEN)

class MatchStatsAPIView(APIView):

    def post(self, request):
        return Response({'error': 'Stay tuned... It doesnt work yet'}, status=status.HTTP_403_FORBIDDEN)

class UpdateMatchHistoryAPIView(APIView):

    def post(self, request):
        return Response({'error': 'Stay tuned... It doesnt work yet'}, status=status.HTTP_403_FORBIDDEN)  
        

class OnlineMatchAPIView(APIView):
    def post(self, request):
        return Response({'error': 'Stay tuned... It doesnt work yet'}, status=status.HTTP_403_FORBIDDEN)
    
class TournamentCreationAPIView(APIView):
    def post(self, request):
        return Response({'error': 'Stay tuned... It doesnt work yet'}, status=status.HTTP_403_FORBIDDEN)
    
class JoinTournamentAPIView(APIView):
    def post(self, request):
        return Response({'error': 'Stay tuned... It doesnt work yet'}, status=status.HTTP_403_FORBIDDEN)
    
class InviteTournamentAPIView(APIView):
    def post(self, request):
        return Response({'error': 'Stay tuned... It doesnt work yet'}, status=status.HTTP_403_FORBIDDEN)

class StartTournamentAPIView(APIView):
    def post(self, request):
        return Response({'error': 'Stay tuned... It doesnt work yet'}, status=status.HTTP_403_FORBIDDEN)