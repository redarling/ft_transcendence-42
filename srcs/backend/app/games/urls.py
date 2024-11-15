from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MatchViewSet, TournamentViewSet

router = DefaultRouter()
router.register(r'matches', MatchViewSet)
router.register(r'tournaments', TournamentViewSet)

urlpatterns = [
    path('', include(router.urls)),

    # Matches creation
    #path('create-match/1v1/offline', MatchViewSet.as_view({'post': 'create_offline_match'})),
    #path('create-match/1v1/online', MatchViewSet.as_view({'post': 'create_online_match'})),
    #path('create-mathc/1v1/bot', MatchViewSet.as_view({'post': 'create_bot_match'})),

    # Update match
    #path('update-match/', MatchUpdateViewSet.as_view({'post': 'update_match'})),
    #path('update-match/<int:id>/', MatchUpdateViewSet.as_view({'post': 'update_match'})),
    

    # Tournaments creation
    #path('create-tournament/', TournamentViewSet.as_view({'post': 'create_tournament'})),
    #path('join-tournament/', TournamentViewSet.as_view({'post': 'join_tournament'})),
    #path('invite-tournament/', TournamentViewSet.as_view({'post': 'invite_tournament'})),

]


