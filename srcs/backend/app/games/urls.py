from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MatchViewSet, TournamentViewSet

router = DefaultRouter()
router.register(r'matches', MatchViewSet)
router.register(r'tournaments', TournamentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
