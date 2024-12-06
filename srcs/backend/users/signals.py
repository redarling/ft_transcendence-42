from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, UserStats

@receiver(post_save, sender=User)
def create_user_stats(sender, instance, created, **kwargs):
    if created:
        UserStats.objects.get_or_create(user=instance)
