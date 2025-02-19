from django.db import IntegrityError, transaction, models
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from games.models import Tournament, TournamentParticipant, TournamentInvitation, Match
from users.models import User, Friend, UserStats
from django.utils import timezone
from django.core.cache import cache
from games.serializers import TournamentSerializer, InvitationTournamentSerializer, RoundSerializer
from games.WebSocket_authentication import WebSocketTokenAuthentication, IsAuthenticatedWebSocket
from users.serializers import UserProfileSearchSerializer
from games.utils import validate_required_fields
import logging
from asgiref.sync import async_to_sync
from games.blockchain_score_storage.deployment import deploy_smart_contract
from ..game_logic.recovery_key_manager import RecoveryKeyManager

logger = logging.getLogger(__name__)

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
            smartContractAddr= deploy_smart_contract(), # Creation of the new block in the blockhain
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

        tournament = get_object_or_404(Tournament, id=tournament_id)

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

        tournament = get_object_or_404(Tournament, id=tournament_id)

        if tournament.status != 'pending':
            return Response(
                {"error": "You cannot invite friends to a tournament that has already started."},
                status=status.HTTP_400_BAD_REQUEST
            )

        friend = get_object_or_404(User, id=friend_id)

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
        try:
            participated_tournaments = TournamentParticipant.objects.filter(user=user).values_list('tournament', flat=True)

            invitations = TournamentInvitation.objects.filter(
                invitee=user
            ).exclude(tournament__in=participated_tournaments)
        
            serializer = InvitationTournamentSerializer(invitations, many=True)
        
            return Response(serializer.data, status=status.HTTP_200_OK)
        except TournamentParticipant.DoesNotExist:
            return Response(
                {"error": "No tournament invitations found."},
                status=status.HTTP_404_NOT_FOUND
            )

class StartTournamentAPIView(APIView):
    def post(self, request):
        """
        Starting a tournament.
        """
        validation_error = validate_required_fields(request.data, ["tournament_id"])
        if validation_error:
            return validation_error
        
        user = request.user
        tournament_id = request.data.get("tournament_id")

        tournament = get_object_or_404(Tournament, id=tournament_id)

        if tournament.status != 'pending':
            return Response({"error": "Tournament has already started."}, status=status.HTTP_400_BAD_REQUEST)
        
        if tournament.creator != user:
            return Response({"error": "Only the creator of the tournament can start it."}, status=status.HTTP_400_BAD_REQUEST)
        
        participants = TournamentParticipant.objects.filter(tournament=tournament)
        if len(participants) < 3:
            return Response({"error": "Tournament must have at least 3 participants to start."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Delete all invitations
        TournamentInvitation.objects.filter(tournament=tournament).delete()

        logger.info("Now creating all redis key for tournament recovery")
        #Map userids to tournament id in redis so they can recover the bracket if they disconnect websocket
        for participant in participants:
            logger.info(f"For participant user id: {participant.user.id} mapping tournament id: {tournament_id}")
            async_to_sync(RecoveryKeyManager.create_tournament_recovery_key)(participant.user.id, tournament_id)
        
        # Update tournament status
        tournament.status = 'in_progress'
        tournament.save()
        return Response({"message": "Tournament has started."}, status=status.HTTP_200_OK)

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

        tournament = get_object_or_404(Tournament, id=tournament_id)

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

        participant = get_object_or_404(TournamentParticipant, tournament=tournament, user=user)

        # Remove the participant
        with transaction.atomic():
            participant.delete()

        async_to_sync(RecoveryKeyManager.delete_tournament_recovery_key)(user.id)

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

        tournament = get_object_or_404(Tournament, id=tournament_id)

        if tournament.creator != user:
            return Response(
                {"error": "Only the creator of the tournament can cancel it."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if tournament.status != 'pending':
            return Response(
                {"error": "Only tournaments in 'pending' status can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST
            )

        participants = TournamentParticipant.objects.filter(tournament=tournament)
        tournament_invitations = TournamentInvitation.objects.filter(tournament=tournament)

        for participant in participants:
            async_to_sync(RecoveryKeyManager.delete_tournament_recovery_key)(participant.user.id)

        # Delete all related data in a single transaction
        with transaction.atomic():
            participants.delete()
            tournament.delete()
            tournament_invitations.delete()

        return Response(
            {"message": "Tournament and all related data have been successfully deleted."},
            status=status.HTTP_200_OK
        )

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
        ).exclude(
            creator=user
        ).exclude(
            id__in=TournamentParticipant.objects.values_list('tournament_id', flat=True).filter(user=user)
        ).annotate(
            participant_count=models.Count('tournamentparticipant')
        ).exclude(participant_count=16)

    def list(self, request, *args, **kwargs):
        query = self.request.query_params.get('title', '').strip()

        if not query:
            return Response({"error": "The title parameter is required."},
                            status=status.HTTP_400_BAD_REQUEST)

        queryset = self.get_queryset()

        if not queryset.exists():
            return Response({"error": "No tournaments found matching the title."},
                            status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class CreateMatchRoundAPIView(APIView):
    """
    Creates a match entry in the database for two players.
    This View could be executed only by the WebSocket server.
    """
    authentication_classes = [WebSocketTokenAuthentication]
    permission_classes = [IsAuthenticatedWebSocket]

    def post(self, request):
        validation_error = validate_required_fields(request.data, ["match_id", "tournament_id", "round_number"])
        if validation_error:
            return validation_error

        match_id = request.data.get("match_id")
        tournament_id = request.data.get("tournament_id")
        round_number = request.data.get("round_number")
        
        try:
            match_id = int(match_id)
            tournament_id = int(tournament_id)
            round_number = int(round_number)
        except ValueError:
            return Response({"detail": "Invalid ID format."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if players exist
        match = get_object_or_404(Match, id=match_id)
        tournament = get_object_or_404(Tournament, id=tournament_id)
        # Create the match record
        round_data = {
            "match": match.id,
            "tournament": tournament.id,
            "round_number": round_number,
        }

        serializer = RoundSerializer(data=round_data)

        if serializer.is_valid():
            try:
                round_match = serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
        
            except IntegrityError as e:
                logger.error(f"Database error during round match creation: {e}")
                return Response({"detail": "Failed to create round match due to a database error."},
                                status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class TournamentUpdateStatusAPIView(APIView):
    """
    Update the status of a tournament.
    """
    authentication_classes = [WebSocketTokenAuthentication]
    permission_classes = [IsAuthenticatedWebSocket]

    def post(self, request):
        validation_error = validate_required_fields(request.data, ["tournament_id", "status"])
        if validation_error:
            return validation_error

        tournament_id = request.data.get("tournament_id")
        tournament = get_object_or_404(Tournament, id=tournament_id)
        tournament_status = request.data.get("status")

        if tournament_status == 'completed':
            winner_id = request.data.get("winner_id")
            user = get_object_or_404(User, id=winner_id)
            userStats = get_object_or_404(UserStats, user=user)
            userStats.record_tournament_win()

            participants = TournamentParticipant.objects.filter(tournament=tournament)
            for participant in participants:
                async_to_sync(RecoveryKeyManager.delete_tournament_recovery_key)(participant.user.id)

        if tournament_status not in ['in_progress', 'completed']:
            return Response({"error": "Invalid status. Must be 'in_progress' or 'completed'."},
                status=status.HTTP_400_BAD_REQUEST)

        tournament.status = tournament_status
        tournament.save()

        return Response({"message": "Tournament status updated successfully."}, status=status.HTTP_200_OK)