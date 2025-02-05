from django.db import IntegrityError
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.exceptions import NotFound
from rest_framework.generics import UpdateAPIView, RetrieveAPIView, ListAPIView
from .models import Tournament, MatchHistory, MatchPlayerStats, TournamentParticipant, Round, Match, TournamentInvitation
from users.models import User, Friend, UserStats
from django.utils import timezone
from .serializers import (UserMatchHistorySerializer, MatchSerializer, 
                          MatchPlayerStatsSerializer, TournamentSerializer,
                          TournamentParticipantSerializer, InvitationTournamentSerializer)
from users.serializers import UserProfileSearchSerializer
from .WebSocket_authentication import WebSocketTokenAuthentication, IsAuthenticatedWebSocket
from .utils import validate_required_fields
from asgiref.sync import async_to_sync
from .game_logic.utils import check_active_match
import logging
from games.blockchain_score_storage.deployment import deploy_smart_contract
from games.blockchain_score_storage.interactions import add_score, get_score

logger = logging.getLogger(__name__)

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
            round = get_object_or_404(Round, match=match)

            try:
                tournament = Tournament.objects.get(id=round.tournament)
            except Tournament.DoesNotExist:
                return Response({"detail": "Tournament not found."}, status=status.HTTP_404_NOT_FOUND)

            add_score(contract_address=tournament.smartContractAddr, match_id=match_id, user_id=player1.id, score=score_player1)
            add_score(contract_address=tournament.smartContractAddr, match_id=match_id, user_id=player2.id, score=score_player2)

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

########################################################################################################
#                                  CHECK FOR ACTIVE MATCH                                              #
########################################################################################################
class CheckActiveMatchAPIView(APIView):
    """
    Checks if there is an active match for the requesting user.
    """

    def get(self, request):
        user = request.user
        return async_to_sync(self.get_match_data)(user)

    async def get_match_data(self, user):
        try:
            match_data = await check_active_match(user)
            if match_data["active"]:
                return Response(match_data, status=status.HTTP_200_OK)
            return Response({'active': False}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error checking active match: {e}")
            return Response({'error': 'An error occurred while checking active match'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

########################################################################################################
#                                  USER MATCH HISTORY AND STATS                                        #
########################################################################################################
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

########################################################################################################
#                                  TOURNAMENT SYSTEM                                                   #
########################################################################################################
class CreateTournamentAPIView(APIView):

    def post(self, request):
        """
        New tournament creation.
        """
        validation_error = validate_required_fields(request.data, ["title", "description"])
        if validation_error:
            return validation_error

        user = request.user
        title = request.data.get("title")
        description = request.data.get("description")

        tournament = Tournament.objects.create(
            title=title,
            smartContractAddr= deploy_smart_contract(), # Creation of the new block in the blochain
            description=description,
            creator=user,
            created_at=timezone.now(),
            updated_at=timezone.now(),
        )

        serializer = TournamentSerializer(tournament)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class JoinTournamentAPIView(APIView):

    def post(self, request):
        """
        Joining a tournament.
        """
        validation_error = validate_required_fields(request.data, ["tournament_id", "tournament_alias"])
        if validation_error:
            return validation_error
        
        user = request.user
        tournament_id = request.data.get("tournament_id")
        tournament_alias = request.data.get("tournament_alias")

        try:
            tournament = Tournament.objects.get(id=tournament_id)
        except Tournament.DoesNotExist:
            return Response({"detail": "Tournament doesn't exist"}, status=status.HTTP_404_NOT_FOUND)

        if tournament.status != 'pending':
            return Response({"detail": "You can't join this tournament."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Check if the user has already joined
        if TournamentParticipant.objects.filter(tournament=tournament, user=user).exists():
            return Response(
                            {"detail": "You are already participating in this tournament"}
                            , status=status.HTTP_400_BAD_REQUEST)

        # Set maximum number of participants to 16
        participant_count = TournamentParticipant.objects.filter(tournament=tournament).count()
        if participant_count >= 16:
            return Response({"detail": "This tournament already has the maximum number of participants."},
                            status=status.HTTP_400_BAD_REQUEST)

        # Create a participant
        participant = TournamentParticipant.objects.create(
            tournament=tournament,
            user=user,
            tournament_alias=tournament_alias
        )
        TournamentParticipant.save(participant)

        webSocketUrl = f"wss://transcendence-pong:7443/ws/tournament/{tournament_id}/"

        return Response({"detail": "You have successfully joined the tournament.", "webSocketUrl": webSocketUrl}, status=status.HTTP_200_OK)

class ListTournamentParticipantsAPIView(APIView):

    def get(self, tournament_id):
        """
        Retrieve the list of participants for a specific tournament.
        """
        try:
            tournament = Tournament.objects.get(id=tournament_id)

            participants = TournamentParticipant.objects.filter(tournament=tournament)
            serializer = TournamentParticipantSerializer(participants, many=True)

            return Response(serializer.data, status=status.HTTP_200_OK)

        except Tournament.DoesNotExist:
            return Response({"error": "Tournament not found."}, status=status.HTTP_404_NOT_FOUND)

class GetOnlineFriendsAPIView(APIView):
    
    def get(self, request):
        """
        Get a list of online friends who are online and not already participating in a specific tournament.
        """
        user = request.user
        tournament_id = request.query_params.get('tournament_id')

        if not tournament_id:
            return Response(
                {"error": "The 'tournament_id' query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get the IDs of users participating in the tournament
        participants = TournamentParticipant.objects.filter(
            tournament_id=tournament_id
        ).values_list('user_id', flat=True)

        # Fetch all friends where the status is 'accepted'
        all_friends = Friend.objects.filter(
            Q(user=user) | Q(friend=user), 
            status='accepted'
        )

        # Extract actual friends by checking both user and friend fields
        friends = []
        for friendship in all_friends:
            if friendship.user == user:
                friends.append(friendship.friend)
            else:
                friends.append(friendship.user)

        # Now exclude friends who are participating in the tournament
        friends_not_in_tournament = [
            friend for friend in friends if friend.id not in participants
        ]

        # Filter online friends
        online_friends = [
            friend for friend in friends_not_in_tournament if friend.online_status
        ]

        if not online_friends:
            return Response(
                {"error": "No eligible friends found online."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Serialize and return online friends
        serializer = UserProfileSearchSerializer(online_friends, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class InviteTournamentAPIView(APIView):
    """
    Invite a single friend to join a specific tournament.
    """

    def post(self, request):
        validation_error = validate_required_fields(request.data, ["tournament_id", "friend_id"])
        if validation_error:
            return validation_error

        tournament_id = request.data.get('tournament_id')
        friend_id = request.data.get('friend_id')

        try:
            tournament = Tournament.objects.get(id=tournament_id, status='pending')
        except Tournament.DoesNotExist:
            return Response(
                {"error": "Tournament not found or access forbidden."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            friend = User.objects.get(id=friend_id)
        except User.DoesNotExist:
            return Response(
                {"error": "Friend not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if the friend is already a participant or has been invited
        if TournamentParticipant.objects.filter(tournament=tournament, user=friend).exists():
            return Response(
                {"error": f"{friend.username} is already a participant in this tournament."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if TournamentInvitation.objects.filter(tournament=tournament, invitee=friend).exists():
            return Response(
                {"error": f"{friend.username} has already been invited to this tournament."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create the invitation
        TournamentInvitation.objects.create(
            tournament=tournament,
            inviter=request.user,
            invitee=friend
        )

        return Response(
            {"message": f"Invitation sent to {friend.username}."},
            status=status.HTTP_200_OK
        )

class InvitationListTournamentAPIView(APIView):
    """
    List all tournament invitations for the requesting user.
    """

    def get(self, request):
        user = request.user

        # Fetch tournaments where the user has received invitations
        participated_tournaments = TournamentParticipant.objects.filter(user=user).values_list('tournament', flat=True)

        invitations = TournamentInvitation.objects.filter(
            invitee=user
        ).exclude(tournament__in=participated_tournaments)

        serializer = InvitationTournamentSerializer(invitations, many=True)
        
        return Response(serializer.data, status=status.HTTP_200_OK)

# TODO: Do not forget to delete TournamentInvitation object after starting a tournament
class StartTournamentAPIView(APIView):
    def post(self, request):
        return Response({'error': 'Stay tuned... It doesnt work yet'}, status=status.HTTP_403_FORBIDDEN)

class LeaveTournamentAPIView(APIView):
    def post(self, request):
        """
        Allow a user to leave a tournament if it hasn't started yet.
        """
        validation_error = validate_required_fields(request.data, ["tournament_id"])
        if validation_error:
            return validation_error
        
        user = request.user
        tournament_id = request.data.get('tournament_id')

        try:
            tournament = Tournament.objects.get(id=tournament_id)
        except Tournament.DoesNotExist:
            return Response(
                {"error": "Tournament not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if tournament.creator == user:
            return Response(
                {"error": "You cannot leave the tournament as you are the creator."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if tournament.status != 'pending':
            return Response(
                {"error": "You cannot leave a tournament that has already started."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            participant = TournamentParticipant.objects.get(tournament=tournament, user=user)
        except TournamentParticipant.DoesNotExist:
            return Response(
                {"error": "You are not a participant in this tournament."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Remove the participant
        with transaction.atomic():
            participant.delete()

        return Response(
            {"message": "You have successfully left the tournament."},
            status=status.HTTP_200_OK
        )

class CancelTournamentAPIView(APIView):
    
    def post(self, request):
        """
        Cancel a tournament and delete all related data if it hasn't started yet.
        """
        validation_error = validate_required_fields(request.data, ["tournament_id"])
        if validation_error:
            return validation_error
        
        user = request.user
        tournament_id = request.data.get('tournament_id')

        try:
            tournament = Tournament.objects.get(id=tournament_id, creator=user)
        except Tournament.DoesNotExist:
            return Response(
                {"error": "Tournament not found or you are not the creator."},
                status=status.HTTP_404_NOT_FOUND
            )

        if tournament.status != 'pending':
            return Response(
                {"error": "Only tournaments in 'pending' status can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST
            )

        participants = TournamentParticipant.objects.filter(tournament=tournament)
        tournament_invitations = TournamentInvitation.objects.filter(tournament=tournament)

        # Delete all related data in a single transaction
        with transaction.atomic():
            participants.delete()
            tournament.delete()
            tournament_invitations.delete()

        return Response(
            {"message": "Tournament and all related data have been successfully deleted."},
            status=status.HTTP_200_OK
        )

# TODO: exclude tournament with 16 participants and where the user is already a participant
class SearchTournamentAPIView(ListAPIView):
    serializer_class = TournamentSerializer

    def get_queryset(self):
        user = self.request.user
        query = self.request.query_params.get('title', '').strip()

        if not query:
            return Tournament.objects.none()

        return Tournament.objects.filter(
            status='pending',
            title__icontains=query
        ).exclude(creator=user)

    def list(self, request, *args, **kwargs):
        query = self.request.query_params.get('title', '').strip()

        if not query:
            return Response({"error": "The 'title' query parameter is required."},
                            status=status.HTTP_400_BAD_REQUEST)

        queryset = self.get_queryset()

        if not queryset.exists():
            return Response({"error": "No tournaments found matching the 'title' query."},
                            status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)