from django.urls import re_path
from .OnlineStatusConsumer import OnlineStatusConsumer
from games.game_logic.MatchmakingConsumer import MatchmakingConsumer
from games.game_logic.TournamentConsumer import TournamentConsumer

websocket_urlpatterns = [
    re_path(r"ws/status/$", OnlineStatusConsumer.as_asgi()),
    re_path(r"ws/matchmaking/$", MatchmakingConsumer.as_asgi()),
    re_path(r"ws/tournament/(?P<tournament_id>\d+)/$", TournamentConsumer.as_asgi()),
]

