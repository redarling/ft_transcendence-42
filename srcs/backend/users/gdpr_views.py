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

# TODO: unfinished
class UserDataExport(APIView):
    """
    View to download all user data in JSON format.
    """
    def post(self, request):
        user = request.user
        data = {
            'username': user.username,
            'email': user.email,
            'friends': [{'username': friend.friend.username, 'status': friend.status} for friend in user.friends.filter(status='accepted')],
            'match_history': [{'match_id': match.id, 'score': f'{match.score_player1}-{match.score_player2}'} for match in user.matches_as_first.all()],
            'tournament_participations': [{'tournament_title': tournament.title, 'status': tournament.status} for tournament in user.tournaments.all()],
            'avatar': user.avatar,
            '2fa_method': user.twofa_method,
            'stats': {
                'total_matches': user.stats.total_matches,
                'total_wins': user.stats.total_wins,
                'total_points_scored': user.stats.total_points_scored,
                'total_points_against': user.stats.total_points_against,
                'current_win_streak': user.stats.current_win_streak,
                'longest_win_streak': user.stats.longest_win_streak,
            }
        }

        return JsonResponse(data)

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