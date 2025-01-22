from .recovery_key_manager import RecoveryKeyManager
from users.models import User
import asyncio
from channels.db import database_sync_to_async
import logging

logger = logging.getLogger(__name__)

async def check_active_match(user):
    """
    Check if the user has an active match.

    Args:
        user: User object.

    Returns:
        dict: If match exists, returns a dictionary with match details, otherwise None.
    """
    try:
        redis = await RecoveryKeyManager.get_redis()
        async for key in redis.scan_iter("match:*:recovery"):
            match_id = key.split(":")[1]
            match_data = await RecoveryKeyManager.get_recovery_key(match_id)

            if match_data and (str(user.id) == match_data["player1_id"] or str(user.id) == match_data["player2_id"]):
                return {
                    'active': True,
                    'match_group': match_data["match_group"],
                    'player1_id': match_data["player1_id"],
                    'player2_id': match_data["player2_id"],
                    'player1_username': match_data["player1_username"],
                    'player2_username': match_data["player2_username"],
                }
        logger.info(f"No active match found for user {user.id}")
        return {'active': False}
    except Exception as e:
        raise Exception(f"Error checking active match for user {user.id}: {e}")

async def check_players_online_statuses(player_id_1, player_id_2, eventQueue, match_group):
    """
    Check if players are still online.
    """
    while True:
        match_data = await RecoveryKeyManager.get_recovery_key(match_group)
        if not match_data:
            logger.info(f"Match {match_group} key is no longer available. Task ending.")
            break

        player_1_online = await is_player_online(player_id_1)
        if not player_1_online:
            await eventQueue.put({
                "event": "player_disconnected",
                "player_id": player_id_1
            })
            break
        
        player_2_online = await is_player_online(player_id_2)
        if not player_2_online:
            await eventQueue.put({
                "event": "player_disconnected",
                "player_id": player_id_2
            })
            break
        await asyncio.sleep(10)

@database_sync_to_async
def is_player_online(player_id):
    """
    Check if a player is online.
    """
    try:
        user = User.objects.get(id=player_id)
        return user.online_status
    except User.DoesNotExist:
        return False