from django.db import models, transaction
from django.utils import timezone
from django.contrib.auth.models import AbstractUser, BaseUserManager
from .redis_manager import UserActivityRedisManager

class UserManager(BaseUserManager):
    def create_user(self, username, email, password, **extra_fields):
        if not email:
            raise ValueError("Email is required.")
        if not username:
            raise ValueError("Username is required.")
        if not password:
            raise ValueError("Password is required.")
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)  # This ensures password is hashed
        user.save(using=self._db)
        return user

class User(AbstractUser):
    email = models.EmailField(unique=True)
    online_status = models.BooleanField(default=False)
    avatar = models.URLField(null=True, blank=True)
    password = models.CharField(max_length=128, default='default_password', null=False)
    active_session_id = models.CharField(max_length=128, null=True, blank=True)
    
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_groups',
        blank=True
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_permissions',
        blank=True
    )
    
    objects = UserManager()

    class Meta:
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['email']),
        ]

    def __str__(self):
        return self.username

    def set_online(self):
        if not self.online_status:
            self.online_status = True
            self.save(update_fields=['online_status'])

    def set_offline(self):
        if self.online_status:
            self.online_status = False
            self.save(update_fields=['online_status'])

    def invalidate_session(self):
        self.active_session_id = None
        self.save(update_fields=['active_session_id'])
    
    def update_last_activity(self):
        UserActivityRedisManager.update_last_activity(self.id)
    
    def check_last_activity_key(self):
        return UserActivityRedisManager.is_active(self.id)

class UserStats(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='stats')
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

    def __str__(self):
        return f"Stats for {self.user.username}"

    def update_win_ratio(self):
        if self.total_matches > 0:
            self.win_ratio = self.total_wins / self.total_matches
        else:
            self.win_ratio = 0.0
        self.save()

    def record_match(self, points_scored, points_against, is_win):
        self.total_matches += 1
        self.total_points_scored += points_scored
        self.total_points_against += points_against
        if is_win:
            self.total_wins += 1
        else:
            self.total_losses += 1
        self.update_win_ratio()
        self.last_match_date = timezone.now().date()
        self.save()

class Friend(models.Model):
    user = models.ForeignKey(User, related_name='friends', on_delete=models.CASCADE)
    friend = models.ForeignKey(User, related_name='friends_with', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=10,
        choices=[('pending', 'Pending'), ('accepted', 'Accepted')],
    )

    class Meta:
        unique_together = ('user', 'friend')
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['friend']),
        ]

    def __str__(self):
        return f"{self.user.username} -> {self.friend.username} ({self.status})"

    @classmethod
    def add_friend(cls, user, friend):
        if user == friend:
            raise ValueError("User cannot be friends with themselves.")
        
        if cls.objects.filter(user=user, friend=friend).exists():
            return None, False

        friendship, created = cls.objects.get_or_create(
            user=user, friend=friend, defaults={'status': 'pending'}
        )
        return friendship, created

    @transaction.atomic
    def accept_friend(self):
        if self.status == 'pending':
            self.status = 'accepted'
            self.save()

    @transaction.atomic
    def decline_friend(self):
        if self.status == 'pending':
            self.delete()
