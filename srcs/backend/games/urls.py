from django.urls import path
from .views import (MatchStartAPIView, MatchEndAPIView, UserMatchHistoryAPIView, MatchStatsAPIView, 
                    CreateTournamentAPIView, JoinTournamentAPIView, InviteTournamentAPIView, 
                    StartTournamentAPIView, CancelTournamentAPIView, SearchTournamentAPIView,
                    GetOnlineFriendsAPIView, LeaveTournamentAPIView, InvitationListTournamentAPIView,
                    CheckActiveMatchAPIView)

urlpatterns = [
    
    path('match/start/', MatchStartAPIView.as_view(), name='match-start'),
    path('match/finish/', MatchEndAPIView.as_view(), name='match-end'),

    path('match-history/<int:id>/', UserMatchHistoryAPIView.as_view(), name='match-history'),
    path('match-stats/<int:match_id>/', MatchStatsAPIView.as_view(), name='match-stats'),

    path('tournament/create/', CreateTournamentAPIView.as_view(), name='create-tournament'),
    path('tournament/join/', JoinTournamentAPIView.as_view(), name='join-tournament'),
    path('friend-list/tournament/invite/', GetOnlineFriendsAPIView.as_view(), name='get-online-friends'),
    path('tournament/invite/', InviteTournamentAPIView.as_view(), name='invite-tournament'),
    path('tournament-invitation-list/', InvitationListTournamentAPIView.as_view(), name='tournament-invitation-list'),
    path('tournament/start/', StartTournamentAPIView.as_view(), name='start-tournament'),
    path('tournament/leave/', LeaveTournamentAPIView.as_view(), name='cancel-tournament'),
    path('tournament/cancel/', CancelTournamentAPIView.as_view(), name='cancel-tournament'),
    path('tournament/search/', SearchTournamentAPIView.as_view(), name='search-tournament'),

    path('check-active-match/', CheckActiveMatchAPIView.as_view(), name='check-active-match'),
]


