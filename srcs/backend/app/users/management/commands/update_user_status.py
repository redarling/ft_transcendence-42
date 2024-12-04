from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import User

class Command(BaseCommand):
    help = 'Update user status (exit if inactive for 10 minutes)'

    def handle(self, *args, **kwargs):
        current_time = timezone.now()

        # Get all users who have been inactive for more than 10 minutes and are still online
        users = User.objects.filter(last_activity__lt=current_time - timezone.timedelta(minutes=10), online_status=True)

        # Set the status of the users to offline
        for user in users:
            user.set_offline()
            user.save()

        self.stdout.write(self.style.SUCCESS('Successfully updated user status.'))
