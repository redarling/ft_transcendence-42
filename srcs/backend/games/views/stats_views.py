from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.exceptions import NotFound
from games.models import MatchHistory, MatchPlayerStats, Match
from users.models import User
from games.serializers import UserMatchHistorySerializer, MatchPlayerStatsSerializer
import logging

logger = logging.getLogger(__name__)

class UserMatchHistoryAPIView(APIView):

    def get(self, request, id):
        """
        Get the match history for a specific user.
        """
        try:
            user = User.objects.get(id=id)
        except User.DoesNotExist:
            raise NotFound({'error': 'User not found.'})
        
        matches_history = MatchHistory.objects.filter(user=user)
        
        serializer = UserMatchHistorySerializer(matches_history, many=True)
        return Response(serializer.data)

class MatchStatsAPIView(APIView):

    def get(self, request, match_id):
        """
        Returns the statistics of both players for a specific match.
        """
        match = get_object_or_404(Match, id=match_id)

        # Get statistics for both players
        players_stats = MatchPlayerStats.objects.filter(match=match)
        if not players_stats.exists():
            return Response(
                {"detail": "Statistics for this match not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Serialize and return both players' statistics
        serializer = MatchPlayerStatsSerializer(players_stats, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)