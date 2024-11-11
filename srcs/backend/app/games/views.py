from django.shortcuts import render
from rest_framework import viewsets
from .models import Match, Tournament
from .serializers import MatchSerializer, TournamentSerializer

class MatchViewSet(viewsets.ModelViewSet):
    queryset = Match.objects.all()
    serializer_class = MatchSerializer

class TournamentViewSet(viewsets.ModelViewSet):
    queryset = Tournament.objects.all()
    serializer_class = TournamentSerializer


