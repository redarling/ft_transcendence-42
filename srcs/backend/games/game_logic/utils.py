from .recovery_key_manager import RecoveryKeyManager
from users.models import User
from games.models import TournamentParticipant, Tournament
from channels.db import database_sync_to_async
from games.game_logic.api_calls import create_match_api, create_round_api, finish_match_api
from typing import List, Dict
import math, random, logging, asyncio

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
            logger.info("match_data: %s", match_data)
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
    
@database_sync_to_async
def is_participant(tournament_id, user):
    """
    Check if the user is a participant in the tournament.
    """
    return TournamentParticipant.objects.filter(
        tournament_id=tournament_id, user=user
    ).exists()

@database_sync_to_async
def get_tournament_data(tournament_id, user_id):
    """
    Get tournament related data.
    """
    try:
        tournament = Tournament.objects.get(id=tournament_id)
        is_admin = tournament.creator.id == user_id
        status = tournament.status
        participants = TournamentParticipant.objects.filter(
            tournament_id=tournament_id
        ).select_related("user")
        return [
            {
                "id": participant.user.id,
                "username": participant.user.username,
                "alias": participant.tournament_alias,
                "avatar": participant.user.avatar,
            }
            for participant in participants
        ], tournament.title, tournament.description, is_admin, status
    except Exception as e:
        return [], None, None, False, None

@database_sync_to_async
def get_tournament_participants(tournament_id):
    """
    Get the list of participants in the tournament.
    """
    try:
        participants = TournamentParticipant.objects.filter(
            tournament_id=tournament_id
        ).select_related("user")
        return [
            {
                "id": participant.user.id,
                "username": participant.user.username,
                "alias": participant.tournament_alias,
                "avatar": participant.user.avatar,
            }
            for participant in participants
        ]
    except Exception as e:
        return []

def determine_number_of_participants_including_bye(number_of_participants):
    """
    Returns the total number of participants including bye (e.g: 3 returns 4, 6 returns 8, ...)
    :param number_of_participants: integer representing the number of users participating to the tournament
    :return: an integer representing the number of users participating to the tournament + the number of bye
    """
    return 2 ** math.ceil(math.log2(number_of_participants))
    
def determine_matches_in_round(participants: List[Dict]) -> List[Dict]:
    """
    Form the round of matches, taking into account the number of participants and possible bye-pass players.

    :param participants: list of dictionaries with participant data
    :return: list of round matches
    """
    total_players = len(participants)

    # Determine the next power of two
    next_power_of_two = 2 ** math.ceil(math.log2(total_players))
    
    # Number of bye-pass players (those who automatically advance to the next round)
    num_byes = next_power_of_two - total_players
    
    # Shuffle participants for random distribution
    random.shuffle(participants)
    
    matches = []
    index = 0

    # Add bye-pass players
    bye_players = participants[:num_byes]
    match_players = participants[num_byes:]
    
    # Form pairs
    while index < len(match_players) - 1:
        matches.append({
            "player1": match_players[index],
            "player2": match_players[index + 1],
        })
        index += 2

    # Add bye-pass players to a separate list
    for player in bye_players:
        matches.append({
            "player1": player,
            "player2": None,  # Automatic win
        })

    return matches

async def create_tournament_matches(matches, tournament_id, round_number):
    """
    Create matches for the tournament round and return their data.

    :param matches: List of matches (player1, player2) from determine_matches_in_round()
    :return: List of dictionaries with match data
    """
    created_matches = []

    for match in matches:
        player1 = match["player1"]
        player2 = match["player2"]

        if player2 is None:
            match_data = {
                "id": None,
                "match_type": "tournament",
                "first_player": player1["id"],
                "second_player": None,
                "player1_username": player1["username"],
                "player2_username": None,
                "player1_avatar": player1["avatar"],
                "player2_avatar": None,
                "score_player1": None,
                "score_player2": None,
                "match_status": "completed",
                "winner": player1["id"],
                "started_at": None,
                "finished_at": None,
            }
        else:
            try:
                match_data = await create_match_api(player1["id"], player2["id"], match_type="tournament")
                round_data = await create_round_api(match_data["id"], tournament_id, round_number)
            except Exception as e:
                logger.error(f"Error creating match for {player1['username']} vs {player2['username']}: {e}")
                continue

        created_matches.append(match_data)

    return created_matches

def generate_bracket(matches, round_number=1, participants=None):
    """
    Form the structure of the tournament bracket for the specified round.

    :param matches: List of matches created through create_tournament_matches()
    :param round_number: Current round number (default 1)
    :param participants: List of all participants (userId, )
    :return: Dictionary with tournament bracket data
    """

    total_participants_including_bye = determine_number_of_participants_including_bye(len(participants))
    
    bracket = {
        "number_of_participants": total_participants_including_bye,
        "round": round_number,
        "matches": []
    }

    for match in matches:

        # TODO: Have to optimize this part by modifying data structures
        player1_alias = "BYE"
        player1_id = match["first_player"]
        player2_alias = "BYE"
        player2_id = match["second_player"]

        for participant_entry in participants:
            if player1_id and participant_entry["id"] == player1_id:
                player1_alias = participant_entry["alias"]
            elif player2_id and participant_entry["id"] == player2_id:
                player2_alias = participant_entry["alias"]
        # -----

        match_entry = {
            "match_id": match["id"],
            "player1_id": match["first_player"],
            "player1_username": match["player1_username"],
            "player1_alias": player1_alias,
            "player1_avatar": match["player1_avatar"],
            "player2_id": match["second_player"],
            "player2_username": match["player2_username"] if match["player2_username"] else "BYE",
            "player2_alias": player2_alias,
            "player2_avatar": match["player2_avatar"],
            "status": match["match_status"],
            "winner": None if match["winner"] is None else match["winner"],
            "score_player1": "0",
            "score_player2": "0"
        }
        bracket["matches"].append(match_entry)

    return bracket

async def finish_match(winner, match_id):
    """
    Finish the match and update the tournament status.
    """
    finish_data = ({
        "match_id": match_id,
        "score_player1": 0,
        "score_player2": 0,
        "winner_id": winner,
        "player1_total_hits": 0,
        "player2_total_hits": 0,
        "player1_serves": 0,
        "player2_serves": 0,
        "player1_successful_serves": 0,
        "player2_successful_serves": 0,
        "player1_longest_rally": 0,
        "player2_longest_rally": 0,
        })
    try:
        await finish_match_api(finish_data)
    except Exception as e:
        logger.error(f"Error during match finishing: {e}")

def get_round_winners(bracket, round_number):
    """
    Returns a list of winners (as dictionaries with id and username) for the specified round.

    :param bracket: List of rounds formed by generate_bracket.
    :param round_number: Round number for which we get the winners.
    :return: List of dictionaries in the form {"id": <id>, "username": <username>} for each winner.
    """
    winners = []
    for round_entry in bracket:
        if round_entry.get("round") == round_number:
            for match in round_entry.get("matches", []):
                if match.get("status") == "finished" and match.get("winner") is not None:
                    if match.get("winner") == match.get("player1_id"):
                        winners.append({
                            "id": match.get("player1_id"),
                            "username": match.get("player1")
                        })
                    elif match.get("winner") == match.get("player2_id"):
                        winners.append({
                            "id": match.get("player2_id"),
                            "username": match.get("player2")
                        })
            break
    return winners



