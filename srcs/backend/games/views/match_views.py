from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.exceptions import NotFound
from games.models import Tournament, MatchHistory, MatchPlayerStats, Round, Match
from users.models import User, UserStats
from django.utils import timezone
from games.serializers import MatchSerializer
from games.WebSocket_authentication import WebSocketTokenAuthentication, IsAuthenticatedWebSocket
from games.utils import validate_required_fields
import logging
from games.blockchain_score_storage.interactions import add_score

logger = logging.getLogger(__name__)

class MatchStartAPIView(APIView):
    authentication_classes = [WebSocketTokenAuthentication]
    permission_classes = [IsAuthenticatedWebSocket]

    def post(self, request):
        """
        Creates a match entry in the database for two players.
        This View could be executed only by the WebSocket server.
        """
        validation_error = validate_required_fields(request.data, ["first_player_id", "second_player_id", "match_type"])
        if validation_error:
            return validation_error

        first_player_id = request.data.get("first_player_id")
        second_player_id = request.data.get("second_player_id")
        match_type = request.data.get("match_type")
        started_at = timezone.now()

        if match_type not in dict(Match.MATCH_TYPES):
            return Response({"detail": "Invalid match type."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            first_player_id = int(first_player_id)
            second_player_id = int(second_player_id)
        except ValueError:
            return Response({"detail": "Invalid ID format."}, status=status.HTTP_400_BAD_REQUEST)
        
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
        
            except IntegrityError as e:
                logger.error(f"Database error during match creation: {e}")
                return Response({"detail": "Failed to create match due to a database error."},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @staticmethod
    def get_user_or_404(user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise NotFound(detail=f'User with ID {user_id} does not exist.')

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
        validation_error = validate_required_fields(request.data, ["match_id", "score_player1", 
                                                                   "score_player2", "winner_id",
                                                                    "player1_total_hits", "player2_total_hits", 
                                                                    "player1_serves", "player2_serves", 
                                                                    "player1_successful_serves", 
                                                                    "player2_successful_serves",
                                                                    "player1_longest_rally", "player2_longest_rally"])
        if validation_error:
            return validation_error

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

        if match.match_type == "tournament":
            # Save to the blockchain
            try:
                round = get_object_or_404(Round, match=match)
                tournament = round.tournament
                add_score(contract_address=tournament.smartContractAddr, match_id=match_id, user_id=player1.id, score=score_player1)
                add_score(contract_address=tournament.smartContractAddr, match_id=match_id, user_id=player2.id, score=score_player2)
            except Tournament.DoesNotExist:
                return Response({"detail": "Tournament not found."}, status=status.HTTP_404_NOT_FOUND)
            except Round.DoesNotExist:
                return Response({"detail": "Round not found."}, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                logger.error(f"Error saving match results to the blockchain: {e}")

        match.finished_at = finished_at
        match.match_status = "completed"

        try:
            winner_id = int(winner_id)
            score_player1 = int(score_player1)
            score_player2 = int(score_player2)
        except ValueError:
            return Response({"detail": "Invalid data format."}, status=status.HTTP_400_BAD_REQUEST)

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
            player=player1,
            points_scored=score_player1,
            points_against=score_player2,
            is_winner=(winner_id == player1.id),
        )
        self.update_player_stats(
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
            ),
            MatchPlayerStats(
                match=match,
                player=player2,
                points_scored=score_player2,
                total_hits=request.data.get("player2_total_hits", 0),
                serves=request.data.get("player2_serves", 0),
                successful_serves=request.data.get("player2_successful_serves", 0),
                longest_rally=request.data.get("player2_longest_rally", 0),
            ),
        ])

        return Response({"detail": "Match has been successfully completed."}, status=status.HTTP_200_OK)

    def update_player_stats(self, player, points_scored, points_against, is_winner):
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