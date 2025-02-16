import smtplib, logging
from email.message import EmailMessage
from django.conf import settings

logger = logging.getLogger(__name__)

class EmailService:
    EMAIL_SERVER = settings.TWOFA_SERVER
    EMAIL_SERVER_PORT = settings.TWOFA_SERVER_PORT
    EMAIL_ADDRESS = settings.TWOFA_EMAIL
    EMAIL_PASSWORD = settings.TWOFA_EMAIL_PASSWORD

    @staticmethod
    def send_email(to_email, subject, body):
        """
        Sends an email with a confirmation code.
        """
        try:
            msg = EmailMessage()
            msg.set_content(body)
            msg["Subject"] = subject
            msg["From"] = EmailService.EMAIL_ADDRESS
            msg["To"] = to_email

            with smtplib.SMTP(EmailService.EMAIL_SERVER, EmailService.EMAIL_SERVER_PORT) as server:
                server.starttls()
                server.login(EmailService.EMAIL_ADDRESS, EmailService.EMAIL_PASSWORD)
                server.send_message(msg)
            
            return True
        except Exception as e:
            logger.error(f"Error sending email: {e}")
            return False

