import aiohttp
from aiohttp import TCPConnector
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

async def create_match_api(player1, player2, match_type):
    """
    Creates a match entry using MatchStartAPIView with WebSocket authentication token.

    :param player1: ID of the first player
    :param player2: ID of the second player
    :param match_type: Type of the match ("1v1" or "tournament")
    :return: Match data as returned by the serializer
    """
    url = "https://nginx/api/games/match/start/"
    headers = {
        "X-WebSocket-Token": settings.WEBSOCKET_API_TOKEN,
        "Content-Type": "application/json",
    }
    payload = {
        "first_player_id": player1,
        "second_player_id": player2,
        "match_type": match_type,
    }

    # Create session with SSL verification disabled because of self-signed certificate
    connector = TCPConnector(ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        async with session.post(url, json=payload, headers=headers) as response:
            if response.status == 201:
                match_data = await response.json()
                return match_data
            elif response.status == 400:
                error_data = await response.json()
                raise ValueError(f"Invalid request: {error_data}")
            elif response.status == 403:
                raise PermissionError("Unauthorized access to match creation API.")
            elif response.status == 500:
                raise Exception("Server error occurred while creating match.")
            else:
                raise Exception(f"Unexpected error: {response.status}, {await response.text()}")

async def finish_match_api(match_data):
    """
    Finish a match using MatchFinishAPIView.
    
    match_data: match_id, score_player1, score_player2, winner_id,
        player1_total_hits, player2_total_hits, player1_serves,
        player2_serves, player1_successful_serves, player2_successful_serves,
        player1_longest_rally, player2_longest_rally, player1_overtime_points,
        player2_overtime_points
    """
    
    url = "https://nginx/api/games/match/finish/"

    headers = {
        "X-WebSocket-Token": settings.WEBSOCKET_API_TOKEN,
        "Content-Type": "application/json",
    }

    # Create session with SSL verification disabled because of self-signed certificate
    connector = TCPConnector(ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        async with session.post(url, json=match_data, headers=headers) as response:
            if response.status == 200:
                return await response.json()
            elif response.status == 400:
                error_data = await response.json()
                raise ValueError(f"Invalid request: {error_data}")
            elif response.status == 403:
                raise PermissionError("Unauthorized access to match creation API.")
            elif response.status == 500:
                raise Exception("Server error occurred while creating match.")
            else:
                raise Exception(f"Unexpected error: {response.status}, {await response.text()}")
       
async def create_round_api(match_id, tournament_id, round_number):
    """
    Create a round entry via API.

    :param match_id: ID of the created match
    :param tournament_id: ID of the tournament
    :param round_number: Current round number
    :return Data of the created round
    """
    
    url = "https://nginx/api/games/tournament/round/create-match/"
    headers = {
        "X-WebSocket-Token": settings.WEBSOCKET_API_TOKEN,
        "Content-Type": "application/json",
    }
    payload = {
        "match_id": match_id,
        "tournament_id": tournament_id,
        "round_number": round_number,
    }

    # Create session with SSL verification disabled because of self-signed certificate
    connector = TCPConnector(ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        async with session.post(url, json=payload, headers=headers) as response:
            if response.status == 201:
                round_data = await response.json()
                return round_data
            elif response.status == 400:
                error_data = await response.json()
                raise ValueError(f"Invalid request: {error_data}")
            elif response.status == 403:
                raise PermissionError("Unauthorized access to round creation API.")
            elif response.status == 500:
                raise Exception("Server error occurred while creating round.")
            else:
                raise Exception(f"Unexpected error: {response.status}, {await response.text()}")

async def update_tournament_status_api(tournament_id, tournament_status, winner_id=None):
    """
    Update the status of the tournament round via API.
    """
    
    url = "https://nginx/api/games/tournament/update-status/"
    headers = {
        "X-WebSocket-Token": settings.WEBSOCKET_API_TOKEN,
        "Content-Type": "application/json",
    }
    payload = {
        "tournament_id": tournament_id,
        "status": tournament_status,
        "winner_id": winner_id,
    }

    # Create session with SSL verification disabled because of self-signed certificate
    connector = TCPConnector(ssl=False)
    async with aiohttp.ClientSession(connector=connector) as session:
        async with session.post(url, json=payload, headers=headers) as response:
            if response.status == 200:
                data = await response.json()
                return data
            elif response.status == 400:
                error_data = await response.json()
                raise ValueError(f"Invalid request: {error_data}")
            elif response.status == 403:
                raise PermissionError("Unauthorized access to round creation API.")
            elif response.status == 500:
                raise Exception("Server error occurred while creating round.")
            else:
                raise Exception(f"Unexpected error: {response.status}, {await response.text()}")       
