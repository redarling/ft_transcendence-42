from django.urls import path
from .views import (MatchStartAPIView, MatchEndAPIView, UserMatchHistoryAPIView, MatchStatsAPIView, 
                    CreateTournamentAPIView, JoinTournamentAPIView, InviteTournamentAPIView, 
                    StartTournamentAPIView, CancelTournamentAPIView, SearchTournamentAPIView)

urlpatterns = [
    
    path('match/start/', MatchStartAPIView.as_view(), name='match-start'),
    path('match/end/', MatchEndAPIView.as_view(), name='match-end'),

    path('match-history/<int:id>/', UserMatchHistoryAPIView.as_view(), name='match-history'),
    path('match-stats/<int:id>/', MatchStatsAPIView.as_view(), name='match-stats'),

    path('tournament/create/', CreateTournamentAPIView.as_view(), name='create-tournament'),
    path('tournament/join/', JoinTournamentAPIView.as_view(), name='join-tournament'),
    path('tournament/invite/', InviteTournamentAPIView.as_view(), name='invite-tournament'),
    path('tournament/start/', StartTournamentAPIView.as_view(), name='start-tournament'),
    path('tournament/cancel/', CancelTournamentAPIView.as_view(), name='cancel-tournament'),
    path('tournament/search/', SearchTournamentAPIView.as_view(), name='search-tournament'),
]


