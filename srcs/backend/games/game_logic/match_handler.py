import json
from .channel_messages import remove_player_from_group, send_group_message
import asyncio

class MatchHandler:
    def __init__(self, player1, player2, match_data, group_name):
        self.player1 = player1
        self.player2 = player2
        self.match_data = match_data
        self.group_name = group_name
        self.running = False
        self.score = {player1: 0, player2: 0}

    async def start(self):
        """Start the match and notify players."""
        self.running = True

        # Notify players about match start
        await send_group_message(self.group_name, {
            "event": "match_start",
            "match_data": self.match_data,
        })

        #while self.running:
            # Simulate game logic (e.g., ball position, scoring)
            #await self.update_game_state()
            #await asyncio.sleep(1)  # Delay for simulation

    #async def update_score(self, scorer):
    #    self.score[scorer] += 1
    #    if self.check_winner():
    #        await self.end_match()
    #    else:
    #        await self.notify_clients()

    #def check_winner(self):
    #    for player, points in self.score.items():
    #        if points >= 11 and points - min(self.score.values()) >= 2:
    #            self.winner = player
    #            return True
    #    return False

    #async def end_match(self):
    #    await self.notify_players({"type": "match_end", "reason": "Match completed."})
    #    remove_player_from_group(self.group_name, f"player_{self.player1}")
    #    remove_player_from_group(self.group_name, f"player_{self.player2}")
