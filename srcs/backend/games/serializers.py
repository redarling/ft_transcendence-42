from rest_framework import serializers
from .models import (Match, MatchHistory, MatchPlayerStats, 
                     Tournament, TournamentParticipant, 
                     TournamentInvitation, Round)

class MatchSerializer(serializers.ModelSerializer):
    player1_username = serializers.CharField(source='first_player.username', read_only=True)
    player2_username = serializers.CharField(source='second_player.username', read_only=True)
    player1_avatar = serializers.CharField(source='first_player.avatar', read_only=True)
    player2_avatar = serializers.CharField(source='second_player.avatar', read_only=True)

    class Meta:
        model = Match
        fields = [
            'id',
            'match_type',
            'first_player',
            'second_player',
            'player1_username',
            'player2_username',
            'player1_avatar',
            'player2_avatar',
            'score_player1',
            'score_player2',
            'match_status',
            'winner',
            'started_at',
            'finished_at'
        ]

    def validate(self, data):
        if data['first_player'] == data['second_player']:
            raise serializers.ValidationError("Players must be different.")
        return data

class MatchHistorySerializer(serializers.ModelSerializer):
    first_player_username = serializers.CharField(source='first_player.username', read_only=True)
    second_player_username = serializers.CharField(source='second_player.username', read_only=True)
    match_type = serializers.CharField(source='get_match_type_display', read_only=True)
    match_status = serializers.CharField(source='get_match_status_display', read_only=True)
    winner_username = serializers.CharField(source='winner.username', read_only=True, required=False)

    class Meta:
        model = Match
        fields = [
            'id', 'first_player', 'second_player', 'first_player_username', 'second_player_username',
            'score_player1', 'score_player2', 'match_type', 'match_status', 'started_at', 'finished_at', 'winner', 'winner_username'
        ]

class UserMatchHistorySerializer(serializers.ModelSerializer):
    match = MatchHistorySerializer()

    class Meta:
        model = MatchHistory
        fields = ['user', 'match']

class MatchPlayerStatsSerializer(serializers.ModelSerializer):
    player_username = serializers.CharField(source='player.username', read_only=True)

    class Meta:
        model = MatchPlayerStats
        fields = [
            'player', 'player_username', 'points_scored', 'serves', 'successful_serves',
            'total_hits', 'longest_rally'
        ]

class TournamentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tournament
        fields = ['id', 'smartContractAddr', 'title', 'description', 'created_at', 'updated_at', 'creator']

class TournamentParticipantSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = TournamentParticipant
        fields = ['user_id', 'user_username', 'tournament_alias']

class InvitationTournamentSerializer(serializers.ModelSerializer):
    title = serializers.CharField(source='tournament.title')
    description = serializers.CharField(source='tournament.description')
    tournament_id = serializers.IntegerField(source='tournament.id')
    inviter_id = serializers.IntegerField(source='inviter.id', read_only=True)
    invited_by = serializers.CharField(source='inviter.username', read_only=True)

    class Meta:
        model = TournamentInvitation
        fields = ['tournament_id', 'title', 'description', 'invited_by', 'inviter_id']

class RoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = ['id', 'match', 'tournament', 'round_number']

    def validate_round_number(self, value):
        """
        Custom validation for round_number to ensure it is a positive integer.
        """
        if value <= 0:
            raise serializers.ValidationError("Round number must be a positive integer.")
        return value

    def create(self, validated_data):
        """
        Override the create method if custom logic is required during creation.
        """
        round_instance = Round.objects.create(**validated_data)
        return round_instance

    def update(self, instance, validated_data):
        """
        Override the update method if custom logic is required during update.
        """
        instance.round_number = validated_data.get('round_number', instance.round_number)
        instance.save()
        return instance
