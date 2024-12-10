import redis
from datetime import timedelta
from django.conf import settings

redis_client = redis.StrictRedis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=0,
    decode_responses=True
)

LAST_ACTIVITY_TTL = 600  # 10 minutes

class UserActivityRedisManager:
    @staticmethod
    def update_last_activity(user_id):
        """
        Updates the user's activity in Redis by setting an expiration time (TTL).
        Uses try-except to handle Redis connection errors.
        """
        redis_key = f"user:{user_id}:last_activity"
        try:
            # Update or set the TTL for the user's activity
            redis_client.setex(redis_key, timedelta(seconds=LAST_ACTIVITY_TTL), "active")
        except redis.ConnectionError:
            # Handle the error when Redis is unreachable or connection fails
            print(f"Error: Unable to connect to Redis for user {user_id}.")
        except redis.TimeoutError:
            # Handle timeout error if Redis takes too long to respond
            print(f"Error: Redis timeout for user {user_id}.")
        except Exception as e:
            # General exception handler to catch any other Redis-related errors
            print(f"An unexpected error occurred while updating activity for user {user_id}: {str(e)}")

    @staticmethod
    def is_active(user_id):
        """
        Checks if the user is active by checking the existence of the key in Redis.
        Uses try-except to handle Redis connection errors.
        """
        redis_key = f"user:{user_id}:last_activity"
        try:
            return redis_client.exists(redis_key) == 1  # Return True if the key exists
        except redis.ConnectionError:
            # Handle the error when Redis is unreachable or connection fails
            print(f"Error: Unable to connect to Redis while checking activity for user {user_id}.")
            return False
        except redis.TimeoutError:
            # Handle timeout error if Redis takes too long to respond
            print(f"Error: Redis timeout while checking activity for user {user_id}.")
            return False
        except Exception as e:
            # General exception handler to catch any other Redis-related errors
            print(f"An unexpected error occurred while checking activity for user {user_id}: {str(e)}")
            return False
