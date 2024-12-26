from channels.layers import get_channel_layer
import logging

logger = logging.getLogger(__name__)

async def add_player_to_group(group_name, channel_name):
    """
    Add a player's WebSocket to a channel group.
    """
    channel_layer = get_channel_layer()
    await channel_layer.group_add(group_name, channel_name)

async def remove_player_from_group(group_name, channel_name):
    """
    Remove a player's WebSocket from a channel group.
    """
    channel_layer = get_channel_layer()
    await channel_layer.group_discard(group_name, channel_name)

async def send_group_message(group_name, message):
    """
    Send a message to all WebSocket connections in a group.
    """
    channel_layer = get_channel_layer()
    try:
        await channel_layer.group_send(group_name, {
            "type": "websocket_message",
            "message": message
        })
    except Exception as e:
        logger.error(f"Error sending message to group {group_name}: {e}")

