from django.http import JsonResponse
from .models import User, Friend
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .two_factor_auth.code_manager import save_2fa_code, get_2fa_code, delete_2fa_code, hash_2fa_code
from .two_factor_auth.challenge_manager import (save_2fa_challenge, get_2fa_challenge, 
                                                delete_2fa_challenge, is_2fa_attempts_exceeded, reset_2fa_attempts)
from .two_factor_auth.email_service import EmailService
import logging, uuid, secrets

logger = logging.getLogger(__name__)

class UserDataExport(APIView):
    """
    View to download all user data in JSON format (GDPR compliance).
    """

    def post(self, request):
        user = request.user
        
        friends = [
            {'username': friend.friend.username, 'status': friend.status}
            for friend in user.friends.filter(status='accepted')
        ]

        friend_requests = [
            {'username': friend.friend.username, 'status': friend.status}
            for friend in user.friends.filter(status='pending')
        ]
        incoming_requests = [
            {'username': friend.user.username, 'status': friend.status}
            for friend in user.friends_with.filter(status='pending')
        ]

        match_history = [
            {
                'match_id': match.id,
                'opponent': match.second_player.username if match.first_player == user else match.first_player.username,
                'score': f'{match.score_player1}-{match.score_player2}',
                'status': match.match_status,
                'winner': match.winner.username if match.winner else None,
                'started_at': match.started_at,
                'finished_at': match.finished_at,
                'player_stats': {
                    'points_scored': stats.points_scored,
                    'serves': stats.serves,
                    'successful_serves': stats.successful_serves,
                    'total_hits': stats.total_hits,
                    'longest_rally': stats.longest_rally
                } if (stats := match.player_stats.filter(player=user).first()) else None
            }
            for match in user.matches_as_first.all() | user.matches_as_second.all()
        ]


        tournament_participations = [
            {
                'tournament_id': tp.tournament.id,
                'tournament_title': tp.tournament.title,
                'status': tp.tournament.status,
                'alias': tp.tournament_alias
            }
            for tp in user.tournamentparticipant_set.all()
        ]

        sent_tournament_invitations = [
            {'tournament': invite.tournament.title, 'invitee': invite.invitee.username, 'created_at': invite.created_at}
            for invite in user.sent_invitations.all()
        ]
        received_tournament_invitations = [
            {'tournament': invite.tournament.title, 'inviter': invite.inviter.username, 'created_at': invite.created_at}
            for invite in user.received_invitations.all()
        ]

        data = {
            'username': user.username,
            'email': user.email,
            'registered_at': user.stats.registered_at,
            'avatar': user.avatar,
            'is_2fa_enabled': user.is_2fa_enabled,
            
            'friends': friends,
            'friend_requests_sent': friend_requests,
            'friend_requests_received': incoming_requests,
            
            'match_history': match_history,
            'tournament_participations': tournament_participations,
            'sent_tournament_invitations': sent_tournament_invitations,
            'received_tournament_invitations': received_tournament_invitations,
            
            'stats': {
                'total_matches': user.stats.total_matches,
                'total_wins': user.stats.total_wins,
                'total_points_scored': user.stats.total_points_scored,
                'total_points_against': user.stats.total_points_against,
                'current_win_streak': user.stats.current_win_streak,
                'longest_win_streak': user.stats.longest_win_streak,
                'tournaments_won': user.stats.tournaments_won,
                'last_match_date': user.stats.last_match_date
            }
        }

        return JsonResponse(data, json_dumps_params={'indent': 4})

# TODO: unfinished
class UserDeleteAccount(APIView):
    """
    View to delete user account.
    """
    def post(self, request):
        user = request.user
        user.delete()
        return JsonResponse({'message': 'Account deleted successfully'})
    
class UserForgotPassword(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        """
        Send reset code to user email.
        """
        email = request.data.get("email")
        
        if not email:
            return Response({"error": "Email are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        code = str(secrets.randbelow(900000) + 100000)
        if EmailService.send_email(user.email, "2FA Verification Code", f"Your verification code: {code}.\nValid for 15 minutes."):
            save_2fa_code(user.id, code)
            user.save()
            return Response({"message": "Verification code sent to your email."}, status=status.HTTP_200_OK)
        return JsonResponse({"error": "Failed to send email."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserVerifyResetCode(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        """
        Verify the reset code sent by email.
        """
        email = request.data.get("email")
        code = request.data.get("code")

        if not email or not code:
            return Response({"error": "Email and code are required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        stored_code = get_2fa_code(user.id)
        if stored_code and stored_code == hash_2fa_code(code):
            delete_2fa_code(user.id)
            user.save()
        else:
            return JsonResponse({'error': 'Invalid code.'}, status=status.HTTP_400_BAD_REQUEST)
        
        challenge_token = str(uuid.uuid4())
        save_message = save_2fa_challenge(user.id, challenge_token)
        if save_message == "already_exists":
            return Response({"error": "Current attempt is still active. Try again later"}, status=status.HTTP_400_BAD_REQUEST)
        elif save_message == "too_soon":
            return Response({"error": "Too many attempts. Try again later."}, status=status.HTTP_403_FORBIDDEN)
        return Response({"challenge_token": challenge_token, "message": "Allowed to reset password."}, status=status.HTTP_200_OK)

class UserResetPassword(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        """
        Reset user password.
        """
        challenge_token = request.data.get("challenge_token")
        new_password = request.data.get("new_password")

        if not challenge_token or not new_password:
            return Response({"error": "Invalid request."}, status=status.HTTP_400_BAD_REQUEST)
        
        user_id = get_2fa_challenge(challenge_token)
        if not user_id:
            return Response({"error": "Invalid or expired challenge."}, status=status.HTTP_400_BAD_REQUEST)

        if is_2fa_attempts_exceeded(user_id):
            return Response({"error": "Too many failed attempts. Try again later."}, status=status.HTTP_403_FORBIDDEN)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        
        reset_2fa_attempts(user.id)
        delete_2fa_challenge(challenge_token)
        user.set_password(new_password)
        user.save()
        return Response({"message": "Password reset successfully."}, status=status.HTTP_200_OK)