from channels.layers import get_channel_layer
import logging

logger = logging.getLogger(__name__)

async def disconnect_user(user_id):
    """
    Disconnect a user from the WebSocket.
    """
    try:
        logger.info(f"Disconnecting user {user_id}")
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            f"player_{user_id}",
            {
                "type": "disconnect.message",
            },
        )
    except Exception as e:
        logger.error(f"Error disconnecting user {user_id}: {e}")

async def add_player_to_group(user_id, match_group, match_data):
    """
    Adds a player to a match channel group.
    """
    logger.info(f"add_player_to_group: Adding player {user_id} to group {match_group}")
    
    channel_layer = get_channel_layer()
    await channel_layer.group_send(
        f"player_{user_id}",
        {
            "type": "matchchannel.message",
            "match_group": match_group,
            "match_data": match_data,
        },
    )

async def remove_player_from_group(group_name, channel_name):
    """
    Remove a player's WebSocket from a channel group.
    """
    try:
        channel_layer = get_channel_layer()
        await channel_layer.group_discard(group_name, channel_name)
    except Exception as e:
        logger.error(f"Error removing player from group {group_name}: {e}")

async def send_group_message(group_name, message):
    """
    Send a message to all WebSocket connections in a group.
    """
    try:
        channel_layer = get_channel_layer()
        await channel_layer.group_send(group_name, {
            "type": "websocket_message",
            "message": message
        })
    except Exception as e:
        logger.error(f"Error sending message to group {group_name}: {e}")

async def send_error_to_players(player1, player2, error_message):
    """
    Notify players about an error during match creation.
    """
    try:
        channel_layer = get_channel_layer()
        for player in [player1, player2]:
            await channel_layer.group_send(
                f"player_{player}",
                {
                    "type": "websocket.message",
                    "message": {"event": "error", "message": error_message},
                },
            )
    except Exception as e:
        logger.error(f"Error sending error message to players: {e}")
