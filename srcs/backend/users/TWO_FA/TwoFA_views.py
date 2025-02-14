from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from io import BytesIO
from users.serializers import TwoFactorActivationSerializer
from .email_service import EmailService
from core.telegram_bot import send_2fa_code
from .code_manager import save_2fa_code, get_2fa_code, delete_2fa_code
import pyotp, logging, qrcode, base64, random

logger = logging.getLogger(__name__)

class TwoFA_ActivateAPIView(APIView):
    def post(self, request):
        """
        Activate 2FA using TOTP, SMS or email.
        """
        serializer = TwoFactorActivationSerializer(data=request.data)
        if serializer.is_valid():
            method = serializer.validated_data.get("method")
            user = request.user
            
            if user.is_2fa_enabled:
                return Response({"error": "2FA is already enabled"}, status=status.HTTP_400_BAD_REQUEST)
            
            if method == "totp":
                if not user.otp_secret:
                    user.otp_secret = pyotp.random_base32()
                    user.save()
                totp = pyotp.TOTP(user.otp_secret)
                uri = totp.provisioning_uri(name=user.username, issuer_name="Transcendence-pong")
                img = qrcode.make(uri)
                buffered = BytesIO()
                img.save(buffered, format="PNG")
                img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
                user.is_2fa_enabled = True
                user.twofa_method = "totp"
                user.save()
                return Response({"method": "totp", "qr_code": img_str, "uri": uri}, status=status.HTTP_200_OK)

            elif method == "sms":
                chat_id = serializer.validated_data.get("chat_id")
                if not chat_id:
                    return Response({"error": "Chat ID is required for Telegram verification."}, status=status.HTTP_400_BAD_REQUEST)
                user.chat_id = chat_id
                code = str(random.randint(100000, 999999))
                user.twofa_method = "sms"
                user.save()
                save_2fa_code(user.id, code)
                if send_2fa_code(user):
                    return Response({"method": "telegram", "message": "Verification code sent via Telegram."}, status=status.HTTP_200_OK)
                else:
                    return Response({"error": "Failed to send Telegram message"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
            elif method == "email":
                code = str(random.randint(100000, 999999))
                
                if EmailService.send_email(user.email, "2FA Verification Code", f"Your verification code: {code}.\nValid for 15 minutes."):
                    save_2fa_code(user.id, code)
                    user.twofa_method = "email"
                    user.save()
                    return Response({"method": "email", "message": "Verification code sent to your email."}, status=status.HTTP_200_OK)
                else:
                    return Response({"error": "Failed to send email"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TwoFA_VerifyAPIView(APIView):
    def post(self, request):
        """
        Verify the 2FA code sent by SMS or email.
        """
        user = request.user
        code = request.data.get("code")
        
        if user.is_2fa_enabled:
                return Response({'message': '2FA is already enabled'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not code:
            return Response({"error": "Verification code is required."}, status=status.HTTP_400_BAD_REQUEST)

        stored_code = get_2fa_code(user.id)
        if stored_code and stored_code == code:
            user.is_2fa_enabled = True
            delete_2fa_code(user.id)
            user.save()
            return Response({"message": "2FA has been enabled."}, status=status.HTTP_200_OK)
        return Response({"error": "Invalid verification code."}, status=status.HTTP_400_BAD_REQUEST)

class TwoFA_DeactivateAPIView(APIView):
    def post(self, request):
        """
        Deactivate 2FA.
        """
        user = request.user
        if not user.is_2fa_enabled:
            return Response({"message": "2FA is already disabled."}, status=status.HTTP_400_BAD_REQUEST)
        
        if user.twofa_method == "sms":
            if send_2fa_code(user):
                pass
            else:
                return Response({"error": "Failed to send Telegram message"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        if user.twofa_method == "email":
            code = str(random.randint(100000, 999999))
            if EmailService.send_email(user.email, "2FA Verification Code", f"Your verification code: {code}"):
                save_2fa_code(user.id, code)
            else:
                delete_2fa_code(user.id)
                return Response({"error": "Failed to send email"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({"message": "2FA ready to deactivate."}, status=status.HTTP_200_OK)
    
class TwoFA_VerifyDeactivateAPIView(APIView):
    def post(self, request):
        """
        Verify the 2FA code sent by SMS or email to deactivate 2FA.
        """
        user = request.user
        code = request.data.get("code")
        
        if not code:
            return Response({"error": "Verification code is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.is_2fa_enabled:
            return Response({"message": "2FA is already disabled."}, status=status.HTTP_400_BAD_REQUEST)
        
        if user.twofa_method == "totp":
            totp = pyotp.TOTP(user.otp_secret)
            if totp.verify(code):
                user.is_2fa_enabled = False
                user.otp_secret = None
                user.twofa_method = "None"
                user.save()
                return Response({"message": "2FA has been deactivated."}, status=status.HTTP_200_OK)
            return Response({"error": "Invalid verification code."}, status=status.HTTP_400_BAD_REQUEST)
        
        stored_code = get_2fa_code(user.id)
        if stored_code and stored_code == code:
            user.is_2fa_enabled = False
            user.twofa_method = "None"
            delete_2fa_code(user.id)
            user.save()
            return Response({"message": "2FA has been deactivated."}, status=status.HTTP_200_OK)

        return Response({"error": "Invalid verification code."}, status=status.HTTP_400_BAD_REQUEST)

