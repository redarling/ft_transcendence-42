import asyncio
from .channel_handling import remove_player_from_group, send_group_message
import random
import logging
from .recovery_key_manager import RecoveryKeyManager
from .api_calls import finish_match_api
from .match_event_queue import MatchEventQueueManager

logger = logging.getLogger(__name__)

FIELD_WIDTH = 10.0  # Horizontal field (x)
FIELD_HEIGHT = 6.0  # Vertical field (z)
PADDLE_HEIGHT = 1.0
PADDLE_WIDTH = 0.2
PADDLE_SPEED = 0.12
BALL_RADIUS = FIELD_HEIGHT / 30
BALL_INITIAL_VELOCITY = 0.03
VELOCITY_MULTIPLIER = 1.3
KICK_OFF_DELAY = 2 # kickoff time delay between points
START_KICK_OFF = 5 # kickoff time delay at the start of the match
MAX_SCORE = 11
WINNING_MARGIN = 2
RATE = 1 / 120  # 120 FPS
MAX_INACTIVITY_TIME = 20

class MatchHandler:
    def __init__(self, player1, player2, group_name, match_data, event_queue):
        self.player1 = self.init_player(player1)
        self.player2 = self.init_player(player2)
        self.ball = self.init_ball()
        self.group_name = group_name
        self.match_data = match_data
        self.running = False
        self.event_queue = event_queue
        self.event_processing_task = None
        self.max_event_processing_rate = RATE
        self.kick_off = True
        asyncio.create_task(self.end_kick_off())
    
    def init_player(self, player_id):
        return {
            "id": player_id,
            "position": 0.0,
            "score": 0,
            "total_hits": 0,
            "serves": 0,
            "successful_serves": 0,
            "longest_rally": 0,
            "last_active": asyncio.get_event_loop().time()
        }

    def init_ball(self):
        return {
            "position": [0.0, 0.0],
            "velocity": [BALL_INITIAL_VELOCITY, BALL_INITIAL_VELOCITY],
            "direction": [random.choice([-1, 1]), random.choice([-1, 1])],
            "timesHit": 0,
            "kick_off": True
        }

    async def start_match(self):
        self.running = True
        self.event_processing_task = asyncio.create_task(self.process_events())
        await asyncio.sleep(START_KICK_OFF)
        self.kick_off = False
        await self.game_loop()

    async def game_loop(self):
        while self.running:
            self.update_ball()
            self.check_collisions()
            self.check_goal()
            if self.check_match_over():
                await self.end_match()
                break
            await self.broadcast_state()
            await asyncio.sleep(RATE)

    async def process_events(self):
        """
        Listens to the event queue.
        Wait for new events in the queue and process them at a fixed rate.
        """
        last_processed_time = asyncio.get_event_loop().time()

        while self.running:
            if not self.event_queue.empty():
                event = await self.event_queue.get()
                await self.handle_event(event)
                self.event_queue.task_done()

            await self.check_inactivity()
            await self.sleep_until_next_event(last_processed_time)
            last_processed_time = asyncio.get_event_loop().time()

    async def handle_event(self, event):
        try:
            if event["event"] == "player_disconnected":
                await self.handle_player_disconnected(event)
            elif event["event"] == "player_action":
                await self.handle_player_action(event["player_id"], event["direction"])
        except Exception as e:
            logger.error(f"Error processing event {event}: {e}")

    async def handle_player_disconnected(self, event):
        logger.info(f"Processing event: {event}")
        disconnected_player_id = event.get("player_id")
        winner = self.player2["id"] if disconnected_player_id == self.player1["id"] else self.player1["id"]
        await self.end_match(winner)

    async def handle_player_action(self, player_id, direction):
        if self.kick_off:
            return

        player = self.player1 if player_id == self.player1["id"] else self.player2
        if direction == "up" and player["position"] + PADDLE_HEIGHT / 2 < FIELD_HEIGHT / 2:
            player["position"] += PADDLE_SPEED
        elif direction == "down" and player["position"] - PADDLE_HEIGHT / 2 > -FIELD_HEIGHT / 2:
            player["position"] -= PADDLE_SPEED

        player["last_active"] = asyncio.get_event_loop().time()
        await self.broadcast_state()
    
    async def check_inactivity(self):
        current_time = asyncio.get_event_loop().time()
        if current_time - self.player1["last_active"] > MAX_INACTIVITY_TIME:
            logger.info(f"Player {self.player1['id']} inactive for {MAX_INACTIVITY_TIME} seconds. Ending match.")
            await self.end_match(self.player2["id"])
        elif current_time - self.player2["last_active"] > MAX_INACTIVITY_TIME:
            logger.info(f"Player {self.player2['id']} inactive for {MAX_INACTIVITY_TIME} seconds. Ending match.")
            await self.end_match(self.player1["id"])
    
    async def sleep_until_next_event(self, last_processed_time):
        current_time = asyncio.get_event_loop().time()
        time_since_last_process = current_time - last_processed_time
        if time_since_last_process < RATE:
            await asyncio.sleep(RATE - time_since_last_process)

    def update_ball(self):
        if self.ball.get("kick_off", False):
            return

        self.ball["position"][0] += self.ball["velocity"][0] * self.ball["direction"][0]
        self.ball["position"][1] += self.ball["velocity"][1] * self.ball["direction"][1]

    def check_collisions(self):
        if abs(self.ball["position"][1]) + BALL_RADIUS >= FIELD_HEIGHT / 2:
            self.ball["direction"][1] *= -1

        if self.check_paddle_collision(self.player1, left=True):
            self.handle_paddle_hit(left=True)
        elif self.check_paddle_collision(self.player2, left=False):
            self.handle_paddle_hit(left=False)

    def check_paddle_collision(self, player, left):

        paddle_x = -FIELD_WIDTH / 2 + PADDLE_WIDTH if left else FIELD_WIDTH / 2 - PADDLE_WIDTH
        paddle_z_min = player["position"] - PADDLE_HEIGHT / 2
        paddle_z_max = player["position"] + PADDLE_HEIGHT / 2
        ball_x = self.ball["position"][0]
        ball_z = self.ball["position"][1]

        if (left and self.ball["direction"][0] > 0) or (not left and self.ball["direction"][0] < 0):
            return False

        if (abs(ball_x - paddle_x) <= BALL_RADIUS and paddle_z_min <= ball_z <= paddle_z_max):
            return True
            
        return False

    def handle_paddle_hit(self, left):
        self.ball["direction"][0] *= -1
        paddle = self.player1 if left else self.player2
        distance_from_center = self.ball["position"][1] - paddle["position"]

        # Update ball velocity based on distance from paddle center
        self.ball["velocity"][1] += distance_from_center * 0.02
        self.ball["timesHit"] = self.ball.get("timesHit", 0) + 1

        # Increment total hits for the paddle
        paddle["total_hits"] += 1

        # Count serve attempts and successful serves
        if self.ball["timesHit"] == 1:  # First hit in rally
            paddle["serves"] += 1
            if (left and self.ball["direction"][0] > 0) or (not left and self.ball["direction"][0] < 0):
                paddle["successful_serves"] += 1

        # Update rally length
        if self.ball["timesHit"] > paddle["longest_rally"]:
            paddle["longest_rally"] = self.ball["timesHit"]

        # Increase ball velocity every 3 hits
        if self.ball["timesHit"] % 3 == 0:
            self.ball["velocity"][0] *= VELOCITY_MULTIPLIER
            self.ball["velocity"][1] *= VELOCITY_MULTIPLIER

    def check_goal(self):
        if abs(self.ball["position"][0]) > FIELD_WIDTH / 2:
            if self.ball["position"][0] > 0:
                self.player1["score"] += 1
            else:
                self.player2["score"] += 1
            self.reset_ball()

    def reset_ball(self):
        self.ball = self.init_ball()
        asyncio.create_task(self.end_kick_off())

    async def end_kick_off(self):
        await asyncio.sleep(KICK_OFF_DELAY)
        self.ball["kick_off"] = False

    async def broadcast_state(self):
        static_state = {
            "player1": {"position": self.player1["position"], "score": self.player1["score"]},
            "player2": {"position": self.player2["position"], "score": self.player2["score"]},
        }

        if static_state != getattr(self, "previous_static_state", None):
            full_state = {
                "event": "game_state",
                "player1": self.player1,
                "player2": self.player2,
                "ball": self.ball,
            }
            await self.send_group_message(full_state)
            self.previous_static_state = static_state
        
        else:
            partial_state = {"event": "game_state", "ball": self.ball}
            await self.send_group_message(partial_state)

    def check_match_over(self):
        if self.player1["score"] >= MAX_SCORE and (self.player1["score"] - self.player2["score"]) >= WINNING_MARGIN:
            return True
        if self.player2["score"] >= MAX_SCORE and (self.player2["score"] - self.player1["score"]) >= WINNING_MARGIN:
            return True
        return False

    async def end_match(self, winner=None):
        """
        End the match.
        """
        if not winner:
            if self.player1["score"] > self.player2["score"]:
                winner = self.player1["id"]
            else:
                winner = self.player2["id"]
        
        await self.send_group_message({
            "event": "match_over",
            "winner": winner,
            "player1_score": self.player1["score"],
            "player2_score": self.player2["score"],
        })

        self.running = False
                
        finish_data = ({
        "match_id": self.match_data["id"],
        "score_player1": self.player1.get("score", 0),
        "score_player2": self.player2.get("score", 0),
        "winner_id": winner,
        "player1_total_hits": self.player1.get("total_hits", 0),
        "player2_total_hits": self.player2.get("total_hits", 0),
        "player1_serves": self.player1.get("serves", 0),
        "player2_serves": self.player2.get("serves", 0),
        "player1_successful_serves": self.player1.get("successful_serves", 0),
        "player2_successful_serves": self.player2.get("successful_serves", 0),
        "player1_longest_rally": self.player1.get("longest_rally", 0),
        "player2_longest_rally": self.player2.get("longest_rally", 0),
        })
        
        await finish_match_api(finish_data)

        # Delete recovery key
        try:
            await RecoveryKeyManager.delete_recovery_key(self.group_name)
            logger.info(f"Recovery key for match {self.match_data['id']} deleted successfully.")
        except Exception as e:
            logger.error(f"Failed to delete recovery key for match {self.match_data['id']}: {e}")

        # Delete event queue
        MatchEventQueueManager.delete_queue(self.group_name)

        # Remove players from the channel
        match_group = f"match_{self.match_data['id']}"
        try:
            await remove_player_from_group(match_group, f"player_{self.player1['id']}")
            await remove_player_from_group(match_group, f"player_{self.player2['id']}")
            logger.info(f"Players removed from match channel {match_group}.")
        except Exception as e:
            logger.error(f"Error removing players from match channel {match_group}: {e}")

    async def send_group_message(self, message):
        await send_group_message(self.group_name, message)
