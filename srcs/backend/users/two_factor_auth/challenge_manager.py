import redis
from django.conf import settings
import time

redis_client = redis.StrictRedis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=0,
    decode_responses=True
)

TWOFA_CHALLENGE_TTL = 900  # 15 minutes
TWOFA_MAX_ATTEMPTS = 5  # Limit of 5 attempts
TWOFA_BLOCK_TIME = 1800  # 30 minutes block
TWOFA_MIN_INTERVAL = 60  # 1 minute

def save_2fa_challenge(user_id, challenge):
    """
    Save a new 2FA challenge (1 challenge per user + anti-flood).
    """
    user_id = str(user_id)
    old_challenge_key = f"2fa_user_challenge:{user_id}"
    last_attempt_key = f"2fa_last_attempt:{user_id}"
    
    # Check if there is an active challenge
    old_challenge = redis_client.get(old_challenge_key)
    if old_challenge:
        return "already_exists"

    # Check if the last request was too recent
    last_attempt = redis_client.get(last_attempt_key)
    if last_attempt and (time.time() - float(last_attempt) < TWOFA_MIN_INTERVAL):
        return "too_soon"

    # Set the new challenge
    challenge_key = f"2fa_challenge:{challenge}"
    redis_client.setex(challenge_key, TWOFA_CHALLENGE_TTL, user_id)

    # Set the user → challenge link
    redis_client.setex(old_challenge_key, TWOFA_CHALLENGE_TTL, challenge)

    # Record the time of the last request
    redis_client.setex(last_attempt_key, TWOFA_MIN_INTERVAL, time.time())

    # Reset the attempts counter
    attempts_key = f"2fa_attempts:{user_id}"
    redis_client.delete(attempts_key)

    return "success"


def get_2fa_challenge(challenge):
    """
    Get the user ID from the challenge.
    """
    challenge_key = f"2fa_challenge:{challenge}"
    return int(redis_client.get(challenge_key)) if redis_client.exists(challenge_key) else None


def delete_2fa_challenge(challenge):
    """
    Delete the 2FA challenge and the user → challenge link.
    """
    challenge_key = f"2fa_challenge:{challenge}"
    user_id = redis_client.get(challenge_key)

    if user_id:
        user_challenge_key = f"2fa_user_challenge:{user_id}"
        redis_client.delete(user_challenge_key)  # Delete the user → challenge link

    redis_client.delete(challenge_key)  # Delete the challenge


def is_2fa_attempts_exceeded(user_id):
    """
    Check if the user has exceeded the limit of attempts.
    """
    attempts_key = f"2fa_attempts:{user_id}"
    block_key = f"2fa_blocked:{user_id}"

    if redis_client.exists(block_key):
        return True  # User is blocked

    attempts = redis_client.get(attempts_key)
    return int(attempts) >= TWOFA_MAX_ATTEMPTS if attempts else False


def increment_2fa_attempts(user_id):
    """
    Increment the counter of failed attempts.
    """
    attempts_key = f"2fa_attempts:{user_id}"
    block_key = f"2fa_blocked:{user_id}"

    attempts = redis_client.incr(attempts_key)
    if attempts == 1:
        redis_client.expire(attempts_key, TWOFA_CHALLENGE_TTL)  # Auto-expire after 15 minutes

    if attempts >= TWOFA_MAX_ATTEMPTS:
        redis_client.setex(block_key, TWOFA_BLOCK_TIME, "blocked")  # Block the user for 30 minutes


def reset_2fa_attempts(user_id):
    """
    Remove the attempts counter.
    """
    attempts_key = f"2fa_attempts:{user_id}"
    block_key = f"2fa_blocked:{user_id}"
    
    redis_client.delete(attempts_key)
    redis_client.delete(block_key)
