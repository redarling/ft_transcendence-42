from django.urls import path
from .views import (MatchHistoryAPIView, MatchStatsAPIView, UpdateMatchHistoryAPIView,
                    OnlineMatchAPIView, TournamentCreationAPIView, JoinTournamentAPIView, 
                    InviteTournamentAPIView, StartTournamentAPIView)

urlpatterns = [
    path('match-history/<int:id>/', MatchHistoryAPIView.as_view(), name='match-history'),
    path('update-match-history/<int:id>/', UpdateMatchHistoryAPIView.as_view(), name='update-match-history'),
    path('match-stats/<int:id>/', MatchStatsAPIView.as_view(), name='match-stats'),

    path('matchmaking/', OnlineMatchAPIView.as_view(), name='matchmaking'),

    path('create-tournament/', TournamentCreationAPIView.as_view(), name='create-tournament'),
    path('join-tournament/', JoinTournamentAPIView.as_view(), name='join-tournament'),
    path('invite-tournament/', InviteTournamentAPIView.as_view(), name='invite-tournament'),
    path('start-tournament/', StartTournamentAPIView.as_view(), name='start-tournament'),
]


