import logging, secrets, requests, os, django, sys, httpx
from django.conf import settings
from telegram import Update
from telegram.ext import Application, CommandHandler, CallbackContext

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger(__name__)

from users.models import User

TOKEN = settings.TWOFA_BOT

async def start(update: Update, context: CallbackContext):
    chat_id = str(update.message.chat_id)
    await update.message.reply_text(
        f"👋 Hello! I'm transcendence-pong bot\n"
        f"Your chat_id: `{chat_id}`.\n"
        "Copy it and add to your profile for 2FA."
    )

def send_2fa_code(user):
    if user.chat_id and user.twofa_method == 'sms':  
        code = str(secrets.randbelow(900000) + 100000)
        user.save_code(code)

        message = f"🔐 Your 2FA code: {code}.\nDon't show it to anyone!\nValid for 15 minutes."
        url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"

        try:
            response = requests.post(url, json={"chat_id": user.chat_id, "text": message})
            response.raise_for_status()
            logger.info("2FA code sent successfully")
            return True
        except (requests.exceptions.RequestException, httpx.ConnectError) as e:
            logger.warning(f"⚠️ Network issue: {e}")
            return False
    return False

def main():
    logger.info("Starting Telegram bot...")
    app = Application.builder().token(TOKEN).build()
    app.add_handler(CommandHandler("start", start))

    logger.info("🚀 Bot started!")
    app.run_polling()

if __name__ == "__main__":
    main()

