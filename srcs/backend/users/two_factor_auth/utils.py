from rest_framework import status
from rest_framework.response import Response
from users.two_factor_auth.code_manager import save_2fa_code
from users.two_factor_auth.email_service import EmailService
from core.telegram_bot import send_2fa_code
import random
from users.models import User

def send_code(user):
    if user.twofa_method == "sms":
        if not user.chat_id:
            return Response({"error": "Error during sending a code."}, status=status.HTTP_400_BAD_REQUEST)
        if send_2fa_code(user):
            return Response({"message": "Verification code sent via Telegram."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Failed to send a code."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    elif user.twofa_method == "email":
        code = str(random.randint(100000, 999999))
        if EmailService.send_email(user.email, "2FA Verification Code", f"Your verification code: {code}.\nValid for 15 minutes."):
            save_2fa_code(user.id, code)
            user.twofa_method = "email"
            user.save()
            return Response({"message": "Verification code sent to your email."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Failed to send a code."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)