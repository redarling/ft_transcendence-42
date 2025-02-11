from .channel_handling import (remove_player_from_group, send_group_message, 
                               send_error_to_players, add_player_to_group)
from .utils import (check_players_online_statuses, get_tournament_participants,
                    determine_matches_in_round, create_tournament_matches,
                    generate_bracket, finish_match, get_round_winners)
from .match_handler import MatchHandler
from .match_event_queue import MatchEventQueueManager
from .recovery_key_manager import RecoveryKeyManager
from .api_calls import update_tournament_status_api
import logging, asyncio

logger = logging.getLogger(__name__)

class TournamentHandler:
    def __init__(self, tournament_id, group_name):
        self.tournament_id = tournament_id
        self.group_name = group_name
        self.match_futures = {}
        self.round_number = 1
        self.bracket = []
    
    async def handle_tournament(self):
        """
        Start the tournament logic.
        """
        await update_tournament_status_api(self.tournament_id, "in_progress")
        await self.tournament_loop()
    
    async def tournament_loop(self):
        """
        Main loop for the tournament.
        """
        participants = await get_tournament_participants(self.tournament_id)

        while len(participants) > 1:
            round_matches = determine_matches_in_round(participants)
            matches = await create_tournament_matches(round_matches, self.tournament_id, self.round_number)
            current_bracket = generate_bracket(matches, self.round_number)
            self.bracket.append(current_bracket)

            await send_group_message(self.group_name, {"event": "tournament_bracket", "data": current_bracket})
            await self.notify_incoming_matches(matches)

            match_futures = [self.match_futures[match["id"]] for match in matches if match.get("id") is not None]
            await asyncio.gather(*match_futures)

            participants = get_round_winners(self.bracket, self.round_number)
            
            if not participants:
                logger.error("No winners found for round %s", self.round_number)
                break
            else:
                logger.info("Tounament %s Round %s winners: %s", self.tournament_id, self.round_number, participants)
            self.round_number += 1

        await send_group_message(
            self.group_name,
            {
                "event": "tournament_end",
                "data": {
                    "winner": participants[0]["username"] if participants else None,
                    "winner_id": participants[0]["id"] if participants else None,
                }
            }
        )
        await update_tournament_status_api(self.tournament_id, "completed", participants[0]["id"] if participants else None)

    async def notify_incoming_matches(self, matches):
        """
        For each match where a pair is defined (player2 != None),
        sends the "incoming_match" event directly to the players,
        and also starts a background task that waits for the ready signal.
        """
        for match in matches:
            # Handle only matches with a pair of players
            if match.get("second_player"):
                match_id = match["id"]
                first_player = str(match["first_player"])
                second_player = str(match["second_player"])

                self.match_futures[match_id] = asyncio.Future()

                await send_group_message(f"player_{first_player}", 
                                         {"event": "incoming_match", "match_id": match_id, "playerId": first_player})
                await send_group_message(f"player_{second_player}",
                                         {"event": "incoming_match", "match_id": match_id, "playerId": second_player})

                # Start a background task that waits for the ready signals for this match
                asyncio.create_task(self.wait_for_match_ready(match))

    async def wait_for_match_ready(self, match):
        """
        Waiting for the ready signal from both players for 30 seconds.
        If both players pressed the ready button — start the match.
        If the timeout (30 sec) occurred and only one (or no) player is ready — sends the auto-win event.
        """
        match_id = match["id"]
        expected_players = {match["first_player"], match["second_player"]}
        match_group = f"match_{match_id}"
        queue = MatchEventQueueManager.get_queue(match_group)
        ready_players = set()

        timeout = 30  # seconds
        start_time = asyncio.get_event_loop().time()

        while len(ready_players) < 2:
            elapsed = asyncio.get_event_loop().time() - start_time
            remaining = timeout - elapsed
            if remaining <= 0:
                break
            try:
                event = await asyncio.wait_for(queue.get(), timeout=remaining)
                # Check if the event matches the expected format
                if event.get("event") == "player_ready" and event.get("matchId") == match_id:
                    player_id = event.get("playerId")
                    if player_id in expected_players:
                        ready_players.add(player_id)
                        logger.info("Player %s is ready for match %s", player_id, match_id)
                    else:
                        logger.warning("Received ready event from player %s not assigned to match %s", player_id, match_id)
                else:
                    logger.warning("Received invalid event for match %s: %s", match_id, event)
            except asyncio.TimeoutError:
                break

        if ready_players == expected_players:
            logger.info("Both players ready for match %s. Starting match.", match_id)
            await self.start_match(match, queue, match_group)
        else:
            # Timeout – not enough ready players
            if len(ready_players) == 1:
                winner = list(ready_players)[0]
                await self.handle_match_timeout(match_id, winner)
            else:
                await self.handle_match_timeout(match_id, match["first_player"])
            MatchEventQueueManager.delete_queue(match_group)
    
    async def handle_match_timeout(self, match_id, winner_id):
        """
        Handle the match timeout event.
        """
        logger.info("Timeout: Not enough ready players for match %s", match_id)
        try:
            await finish_match(winner_id, match_id)
            await self.update_bracket(self.round_number, match_id, winner_id, "0-0")
            self.match_futures[match_id].set_result(True)
        except Exception as e:
            logger.error(f"Error during match timeout handling: {e}")
            self.match_futures[match_id].set_result(True)

    async def start_match(self, match_data, eventQueue, match_group):
        """
        Start the match handler for both players.
        """
        try:
            player1 = str(match_data['first_player'])
            player2 = str(match_data['second_player'])
            logger.info("Starting tournament match: %s vs %s", player1, player2)
            

            await add_player_to_group(player1, match_group, match_data)
            await add_player_to_group(player2, match_group, match_data)

            await RecoveryKeyManager.create_recovery_key(match_group, player1, match_data['player1_username'], 
                                                            player2, match_data['player2_username'], 
                                                            match_data['player1_avatar'], match_data['player2_avatar'])

            match_handler = MatchHandler(player1, player2, match_group, match_data, eventQueue)
            match_task = asyncio.create_task(match_handler.start_match())
            
            def done_callback(task):
                async def wrapper():
                    try:
                        result = task.result()
                        logger.info("Match %s result: %s", match_data["id"], result)
                        await self.update_bracket(self.round_number, match_data["id"], result["winner"], result["score"])
                    except Exception as e:
                        logger.error("Error obtaining match result: %s", e)
                    finally:
                        self.match_futures[match_data["id"]].set_result(True)
                asyncio.create_task(wrapper())
                
            match_task.add_done_callback(done_callback)
            asyncio.create_task(check_players_online_statuses(player1, player2, eventQueue, match_group))
        
        except Exception as e:
            logger.error(f"Error during match handling: {e}")
            await send_error_to_players(player1, player2, "Failed to start the match.")
            await self.handle_match_timeout(match_data["id"], match_data["first_player"])
            self.match_futures[match_data["id"]].set_result(True)

    async def update_bracket(self, round_number, match_id, winner, score):
        """
        Update the match data in the tournament bracket for the specified round.

        :param round_number: Round number where the match took place.
        :param match_id: Match ID that has ended.
        :param winner: identifier of the winner to be recorded in the bracket.
        :param score: The final score of the match (e.g., "11-5").
        :return: True if the update was successful, otherwise False (e.g., if the round or match was not found).
        """
        for round_entry in self.bracket:
            if round_entry.get("round") == round_number:
                for match_entry in round_entry.get("matches", []):
                    if match_entry.get("matchId") == match_id:
                        match_entry["winner"] = winner
                        match_entry["score"] = score
                        match_entry["status"] = "finished"

                        if winner == match_entry["player1_id"]:
                            winner_username = match_entry["player1"]
                        else:
                            winner_username = match_entry["player2"]
                        
                        match_update = {
                        "matchId": match_id,
                        "winner": winner_username,
                        "status": "finished",
                        "score": score,
                        "winner_id": winner
                        }

                        await send_group_message(self.group_name, {"event": "match_update", "data": match_update})
                        return True
        return False
