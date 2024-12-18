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
        choices=[('in_progress', 'In Progress'), ('completed', 'Completed')],
        default='in_progress'
    )
    winner = models.ForeignKey(User, related_name='matches_won', null=True, blank=True, on_delete=models.SET_NULL)
    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['first_player']),
            models.Index(fields=['second_player']),
        ]

class MatchPlayerStats(models.Model):
    match = models.ForeignKey(Match, on_delete=models.CASCADE, related_name='player_stats')
    player = models.ForeignKey(User, on_delete=models.CASCADE)
    points_scored = models.IntegerField(default=0)
    serves = models.IntegerField(default=0)
    successful_serves = models.IntegerField(default=0)
    total_hits = models.IntegerField(default=0)
    longest_rally = models.IntegerField(default=0)
    overtime_points = models.IntegerField(default=0)
    total_duration = models.DurationField(null=True, blank=True)

    class Meta:
        unique_together = ('match', 'player')
        indexes = [
            models.Index(fields=['match', 'player']),
        ]

class MatchHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    match = models.ForeignKey(Match, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'match')
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['match']),
        ]

class Tournament(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tournaments', default=None)
    status = models.CharField(
        max_length=12,
        choices=[('pending', 'Pending'), ('in_progress', 'In Progress'), ('completed', 'Completed')],
        default='pending'
    )

    class Meta:
        indexes = [
            models.Index(fields=['created_at']),
        ]

class TournamentParticipant(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    tournament_alias = models.CharField(max_length=50, null=True, blank=True)  # Alias(special name) for the tournament participant

    class Meta:
        unique_together = ('tournament', 'user')
        indexes = [
            models.Index(fields=['tournament']),
        ]
    
    def is_ready(self):
        """Check if the participant has chosen their alias."""
        return self.tournament_alias is not None

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

class TournamentInvitation(models.Model):
    tournament = models.ForeignKey(Tournament, on_delete=models.CASCADE)
    inviter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_invitations')
    invitee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_invitations')
    status = models.CharField(
        max_length=10,
        choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('rejected', 'Rejected')],
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('tournament', 'invitee')
        indexes = [
            models.Index(fields=['tournament']),
        ]