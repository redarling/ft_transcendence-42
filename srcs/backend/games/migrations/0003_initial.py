# Generated by Django 4.2.5 on 2025-02-23 16:53

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('games', '0002_initial'),
        ('users', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='tournamentparticipant',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='users.user'),
        ),
        migrations.AddField(
            model_name='tournamentinvitation',
            name='invitee',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='received_invitations', to='users.user'),
        ),
        migrations.AddField(
            model_name='tournamentinvitation',
            name='inviter',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_invitations', to='users.user'),
        ),
        migrations.AddField(
            model_name='tournamentinvitation',
            name='tournament',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='games.tournament'),
        ),
        migrations.AddField(
            model_name='tournament',
            name='creator',
            field=models.ForeignKey(default=None, on_delete=django.db.models.deletion.CASCADE, related_name='created_tournaments', to='users.user'),
        ),
        migrations.AddField(
            model_name='round',
            name='match',
            field=models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to='games.match'),
        ),
        migrations.AddField(
            model_name='round',
            name='tournament',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='games.tournament'),
        ),
        migrations.AddField(
            model_name='matchplayerstats',
            name='match',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='player_stats', to='games.match'),
        ),
        migrations.AddField(
            model_name='matchplayerstats',
            name='player',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='users.user'),
        ),
        migrations.AddField(
            model_name='matchhistory',
            name='match',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='games.match'),
        ),
        migrations.AddField(
            model_name='matchhistory',
            name='user',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='users.user'),
        ),
        migrations.AddField(
            model_name='match',
            name='first_player',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='matches_as_first', to='users.user'),
        ),
        migrations.AddField(
            model_name='match',
            name='second_player',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='matches_as_second', to='users.user'),
        ),
        migrations.AddField(
            model_name='match',
            name='winner',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='matches_won', to='users.user'),
        ),
        migrations.AddIndex(
            model_name='tournamentparticipant',
            index=models.Index(fields=['tournament'], name='games_tourn_tournam_eaf1ba_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='tournamentparticipant',
            unique_together={('tournament', 'user')},
        ),
        migrations.AddIndex(
            model_name='tournamentinvitation',
            index=models.Index(fields=['tournament'], name='games_tourn_tournam_7070d9_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='tournamentinvitation',
            unique_together={('tournament', 'invitee')},
        ),
        migrations.AddIndex(
            model_name='tournament',
            index=models.Index(fields=['title'], name='games_tourn_title_894b2a_idx'),
        ),
        migrations.AddIndex(
            model_name='round',
            index=models.Index(fields=['match'], name='games_round_match_i_ce4a46_idx'),
        ),
        migrations.AddIndex(
            model_name='round',
            index=models.Index(fields=['tournament'], name='games_round_tournam_175f67_idx'),
        ),
        migrations.AddIndex(
            model_name='matchplayerstats',
            index=models.Index(fields=['match', 'player'], name='games_match_match_i_56a186_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='matchplayerstats',
            unique_together={('match', 'player')},
        ),
        migrations.AddIndex(
            model_name='matchhistory',
            index=models.Index(fields=['user'], name='games_match_user_id_d19670_idx'),
        ),
        migrations.AddIndex(
            model_name='matchhistory',
            index=models.Index(fields=['match'], name='games_match_match_i_f99807_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='matchhistory',
            unique_together={('user', 'match')},
        ),
        migrations.AddIndex(
            model_name='match',
            index=models.Index(fields=['first_player'], name='games_match_first_p_6275e1_idx'),
        ),
        migrations.AddIndex(
            model_name='match',
            index=models.Index(fields=['second_player'], name='games_match_second__b7475e_idx'),
        ),
    ]
