import redis
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class MatchmakingQueue:
    def __init__(self):
        self.redis = redis.StrictRedis(
            host=settings.REDIS_HOST,
            port=settings.REDIS_PORT,
            db=0,
            decode_responses=True
        )
        self.queue_key = "matchmaking_queue"

    def add_player(self, player_id):
        """
        Add a player to the queue. Prevent duplicates.
        """
        if not self.redis.lpos(self.queue_key, player_id):
            self.redis.rpush(self.queue_key, player_id)
            logger.info(f"Player {player_id} added to the queue.")
        else:
            logger.info(f"Player {player_id} is already in the queue.")

    def remove_player(self, player_id):
        """
        Remove a player from the queue atomically.
        """
        lua_script = """
        local index = redis.call('lpos', KEYS[1], ARGV[1])
        if index then
            redis.call('lrem', KEYS[1], 1, ARGV[1])
            return true
        else
            return false
        end
        """
        try:
            result = self.redis.eval(lua_script, 1, self.queue_key, player_id)
            if result:
                logger.info(f"Player {player_id} removed from the queue.")
            else:
                logger.info(f"Player {player_id} not found in the queue.")
        except Exception as e:
            logger.error(f"Error removing player {player_id} from the queue: {e}")

    def is_player_in_queue(self, player_id):
        """
        Check if a player is already in the queue.
        """
        try:
            # Use Redis LPOS command to check if the player exists in the queue
            return self.redis.lpos(self.queue_key, player_id) is not None
        except Exception as e:
            logger.error(f"Error checking if player {player_id} is in the queue: {e}")
            return False
    
    def get_queue(self):
        """
        Returns the current queue as a list.
        """
        queue = self.redis.lrange(self.queue_key, 0, -1)
        return queue if queue else []

    def get_next_match(self):
        """
        Finds a pair of players atomically using Lua script.
        """

        if self.redis.llen(self.queue_key) < 2:
            return None
        
        lua_script = """
        local player1 = redis.call('lpop', KEYS[1])
        local player2 = redis.call('lpop', KEYS[1])
        if player1 and player2 then
            redis.call('srem', KEYS[2], player1, player2)
            return {player1, player2}
        else
            if player1 then
                redis.call('lpush', KEYS[1], player1)
            end
            return nil
        end
        """
        try:
            result = self.redis.eval(lua_script, 2, self.queue_key, f"{self.queue_key}_set")
            if result:
                logger.info(f"Match found: {result[0]} vs {result[1]}")
                return result[0], result[1]
        except Exception as e:
            logger.error(f"Error finding next match: {e}")
        return None

    def _update_queue(self, new_queue):
        """
        Updates the queue in Redis atomically.
        """
        try:
            self.redis.delete(self.queue_key)
            self.redis.delete(f"{self.queue_key}_set")
            if new_queue:  # Ensure queue is not empty
                self.redis.rpush(self.queue_key, *new_queue)
                self.redis.sadd(f"{self.queue_key}_set", *new_queue)
            logger.info(f"Queue updated successfully. New queue: {new_queue}")
        except Exception as e:
            logger.info(f"Error updating queue: {e}")

    def clear(self):
        """
        Clears the queue (e.g., after a reload).
        """
        self.redis.delete(self.queue_key)
        self.redis.delete(f"{self.queue_key}_set")
        logger.info("Queue cleared.")
