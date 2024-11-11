from django.db import models
from users.models import User

class Match(models.Model):
    MATCH_TYPES = [('1v1', '1v1'), ('tournament', 'Tournament')]
    match_type = models.CharField(max_length=10, choices=MATCH_TYPES, default='1v1')
    first_player = models.ForeignKey(User, related_name='matches_as_first', on_delete=models.CASCADE)
    second_player = models.ForeignKey(User, related_name='matches_as_second', on_delete=models.CASCADE)
    score_player1 = models.IntegerField(default=0)
    score_player2 = models.IntegerField(default=0)
    match_status = models.CharField(
        max_length=12,
        choices=[('pending', 'Pending'), ('in_progress', 'In Progress'), ('completed', 'Completed')],
        default='pending'
    )
    winner = models.ForeignKey(User, related_name='matches_won', null=True, blank=True, on_delete=models.SET_NULL)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    total_duration = models.DurationField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['first_player']),
            models.Index(fields=['second_player']),
        ]

class Tournament(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['created_at']),
        ]

class TournamentParticipant(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('tournament', 'user')

class Round(models.Model):
    match = models.OneToOneField(Match, on_delete=models.CASCADE)
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    round_status = models.CharField(
        max_length=12,
        choices=[('pending', 'Pending'), ('in_progress', 'In Progress'), ('completed', 'Completed')],
        default='pending'
    )
    round_number = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['match']),
            models.Index(fields=['tournament']),
        ]

class MatchHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    match = models.ForeignKey(Match, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'match')