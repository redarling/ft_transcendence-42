import json
from redis.asyncio import Redis
from django.conf import settings

class RecoveryKeyManager:
    """
    Manages Redis-based recovery keys for active matches.
    """

    _redis = None

    @classmethod
    async def get_redis(cls):
        """
        Singleton pattern for Redis connection.
        """
        if not cls._redis:
            cls._redis = Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                decode_responses=True
            )
        return cls._redis

    @classmethod
    async def create_recovery_key(cls, match_group, player1_id, player1_username, player2_id, player2_username, avatar1, avatar2, ttl=3600):
        """
        Creates a recovery key for the match with a specified TTL.
        """
        redis = await cls.get_redis()
        key = f"match:{match_group}:recovery"
        value = {
            "match_group": match_group,
            "player1_id": player1_id,
            "player1_username": player1_username,
            "player2_id": player2_id,
            "player2_username": player2_username,
            "player1_avatar": avatar1,
            "player2_avatar": avatar2,
        }
        await redis.set(key, json.dumps(value), ex=ttl)

    @classmethod
    async def get_recovery_key(cls, match_group):
        """
        Retrieves a recovery key for the given match_group
        """
        redis = await cls.get_redis()
        key = f"match:{match_group}:recovery"
        value = await redis.get(key)
        return json.loads(value) if value else None

    @classmethod
    async def delete_recovery_key(cls, match_group):
        """
        Deletes the recovery key for the given match_group.
        """
        redis = await cls.get_redis()
        key = f"match:{match_group}:recovery"
        await redis.delete(key)
