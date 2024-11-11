from django.db import models

class User(models.Model):
    username = models.CharField(max_length=255, unique=True)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)
    online_status = models.BooleanField(default=False)
    avatar = models.TextField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['email']),
        ]

class UserStats(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    total_matches = models.IntegerField(default=0)
    total_wins = models.IntegerField(default=0)
    total_losses = models.IntegerField(default=0)
    win_ratio = models.FloatField(default=0.0)
    total_points_scored = models.IntegerField(default=0)
    total_points_against = models.IntegerField(default=0)
    last_match_date = models.DateField(null=True, blank=True)
    registered_at = models.DateField(auto_now_add=True)
    tournaments_won = models.IntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=['user']),
        ]

class Friend(models.Model):
    user = models.ForeignKey(User, related_name='friends', on_delete=models.CASCADE)
    friend = models.ForeignKey(User, related_name='friends_with', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=10,
        choices=[('pending', 'Pending'), ('accepted', 'Accepted'), ('declined', 'Declined')],
    )

    class Meta:
        unique_together = ('user', 'friend')
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['friend']),
        ]
