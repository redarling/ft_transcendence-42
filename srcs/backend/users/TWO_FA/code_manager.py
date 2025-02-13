import redis
from django.conf import settings

redis_client = redis.StrictRedis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=0,
    decode_responses=True
)

TWOFA_CODE_TTL = 900

def save_2fa_code(user_id, code):
    """
    Save the 2FA code in Redis.
    """
    key = f"2fa_code:{user_id}"
    redis_client.setex(key, TWOFA_CODE_TTL, code)


def get_2fa_code(user_id):
    """
    Get the 2FA code from Redis.
    """
    key = f"2fa_code:{user_id}"
    return redis_client.get(key)


def delete_2fa_code(user_id):
    """
    Delete the 2FA code from Redis after verification.
    """
    key = f"2fa_code:{user_id}"
    redis_client.delete(key)
