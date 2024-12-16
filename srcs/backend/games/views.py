from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
#from rest_framework.generics import UpdateAPIView, RetrieveAPIView, ListAPIView
from .models import Tournament, MatchHistory, MatchPlayerStats, TournamentParticipant, Round, Match
from users.models import User, Friend, UserStats
from django.utils import timezone
from .serializers import UserMatchHistorySerializer, MatchSerializer, MatchPlayerStatsSerializer
from .WebSocket_authentication import WebSocketTokenAuthentication, IsAuthenticatedWebSocket

########################################################################################################
#                                  MATCH SESSION                                                       #
########################################################################################################
class MatchStartAPIView(APIView):
    authentication_classes = [WebSocketTokenAuthentication]
    permission_classes = [IsAuthenticatedWebSocket]

    def post(self, request):
        """
        Creates a match entry in the database for two players.
        This View could be executed only by the WebSocket server.
        """
        
        first_player_id = request.data.get("first_player_id")
        second_player_id = request.data.get("second_player_id")
        match_type = request.data.get("match_type")
        started_at = timezone.now()

        # Validate input data
        if not first_player_id or not second_player_id:
            return Response({"detail": "Both player IDs are required."}, status=status.HTTP_400_BAD_REQUEST)

        if not match_type or match_type not in dict(Match.MATCH_TYPES):
            return Response({"detail": "Invalid match type."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if players exist
        player_1 = self.get_user_or_404(first_player_id)
        player_2 = self.get_user_or_404(second_player_id)

        # Create the match record
        match_data = {
            "first_player": player_1.id,
            "second_player": player_2.id,
            "match_status": "in_progress",
            "match_type": match_type,
            "started_at": started_at,
        }

        serializer = MatchSerializer(data=match_data)

        if serializer.is_valid():
            try:
                match = serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except IntegrityError:
                return Response({"detail": "Failed to create match due to a database error."},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @staticmethod
    def get_user_or_404(user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise Response({'error': f'User with ID {user_id} does not exist.'}, 
                           status=status.HTTP_404_NOT_FOUND)

class MatchEndAPIView(APIView):
    """
    Handles the completion of a match. Updates match data, player stats, match history,
    and user statistics based on the provided final results.
    This View could be executed only by the WebSocket server.
    """
    authentication_classes = [WebSocketTokenAuthentication]
    permission_classes = [IsAuthenticatedWebSocket]

    def post(self, request):
        # Validate required fields
        required_fields = [
        "match_id", "score_player1", "score_player2", "winner_id",
        "player1_total_hits", "player2_total_hits", "player1_serves", "player2_serves",
        "player1_successful_serves", "player2_successful_serves", 
        "player1_longest_rally", "player2_longest_rally", 
        "player1_overtime_points", "player2_overtime_points", "total_duration"
        ]

        if any(request.data.get(field) is None for field in required_fields):
            return Response({"detail": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST)
        
        match_id = request.data.get("match_id")
        score_player1 = request.data.get("score_player1")
        score_player2 = request.data.get("score_player2")
        finished_at = timezone.now()
        winner_id = request.data.get("winner_id")

        # Fetch the match
        try:
            match = Match.objects.get(id=match_id)
        except Match.DoesNotExist:
            return Response({"detail": "Match not found."}, status=status.HTTP_404_NOT_FOUND)

        # Ensure the match is still in progress
        if match.match_status == "completed":
            return Response({"detail": "Match has already been completed."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Fetch players
        player1 = match.first_player
        player2 = match.second_player

        # Update match details
        match.score_player1 = score_player1
        match.score_player2 = score_player2
        match.finished_at = finished_at
        match.match_status = "completed"

        # Determine winner
        if winner_id == player1.id:
            match.winner = player1
        elif winner_id == player2.id:
            match.winner = player2
        else:
            return Response({"detail": "Invalid winner ID."}, status=status.HTTP_400_BAD_REQUEST)

        match.save()

        # Update individual player stats
        self.update_player_stats(
            match=match,
            player=player1,
            points_scored=score_player1,
            points_against=score_player2,
            is_winner=(winner_id == player1.id),
        )
        self.update_player_stats(
            match=match,
            player=player2,
            points_scored=score_player2,
            points_against=score_player1,
            is_winner=(winner_id == player2.id),
        )

        # Add match to history
        MatchHistory.objects.bulk_create([
            MatchHistory(user=player1, match=match),
            MatchHistory(user=player2, match=match),
        ])

        # Save detailed match statistics
        MatchPlayerStats.objects.bulk_create([
            MatchPlayerStats(
                match=match,
                player=player1,
                points_scored=score_player1,
                total_hits=request.data.get("player1_total_hits", 0),
                serves=request.data.get("player1_serves", 0),
                successful_serves=request.data.get("player1_successful_serves", 0),
                longest_rally=request.data.get("player1_longest_rally", 0),
                overtime_points=request.data.get("player1_overtime_points", 0),
                total_duration=request.data.get("total_duration", None),
            ),
            MatchPlayerStats(
                match=match,
                player=player2,
                points_scored=score_player2,
                total_hits=request.data.get("player2_total_hits", 0),
                serves=request.data.get("player2_serves", 0),
                successful_serves=request.data.get("player2_successful_serves", 0),
                longest_rally=request.data.get("player2_longest_rally", 0),
                overtime_points=request.data.get("player2_overtime_points", 0),
                total_duration=request.data.get("total_duration", None),
            ),
        ])

        return Response({"detail": "Match has been successfully completed."}, status=status.HTTP_200_OK)

    def update_player_stats(self, match, player, points_scored, points_against, is_winner):
        """
        Updates UserStats for a given player based on match results.
        """
        try:
            user_stats = player.stats
        except UserStats.DoesNotExist:
            user_stats = UserStats.objects.create(user=player)

        user_stats.record_match(
            points_scored=points_scored,
            points_against=points_against,
            is_win=is_winner,
        )

########################################################################################################
#                                  USER MATCH HISTORY AND STATS                                        #
########################################################################################################
class UserMatchHistoryAPIView(APIView):

    def get(self, id):
        """
        Get the match history for a specific user.
        """
        user = get_object_or_404(User, id=id)
        
        matches_history = MatchHistory.objects.filter(user=user)
        
        serializer = UserMatchHistorySerializer(matches_history, many=True)
        return Response(serializer.data)

class MatchStatsAPIView(APIView):

    def get(self, request, match_id):
        """
        Returns the statistics of the requesting user for a specific match.
        """
        match = get_object_or_404(Match, id=match_id)

        # Check if the user is a participant in the match
        if request.user not in [match.first_player, match.second_player]:
            return Response({"detail": "You are not authorized to view this match's statistics."}, status=status.HTTP_403_FORBIDDEN)

        # Get the user's stats for the match
        try:
            player_stats = MatchPlayerStats.objects.get(match=match, player=request.user)
        except MatchPlayerStats.DoesNotExist:
            return Response({"detail": "Statistics for this user in the match not found."}, status=status.HTTP_404_NOT_FOUND)

        # Serialize and return the player's statistics
        serializer = MatchPlayerStatsSerializer(player_stats)
        return Response(serializer.data, status=status.HTTP_200_OK)
       

########################################################################################################
#                                  TOURNAMENT SYSTEM                                                   #
########################################################################################################
class CreateTournamentAPIView(APIView):
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

class CancelTournamentAPIView(APIView):
    def post(self, request):
        return Response({'error': 'Stay tuned... It doesnt work yet'}, status=status.HTTP_403_FORBIDDEN)
    
class SearchTournamentAPIView(APIView):
    def post(self, request):
        return Response({'error': 'Stay tuned... It doesnt work yet'}, status=status.HTTP_403_FORBIDDEN)