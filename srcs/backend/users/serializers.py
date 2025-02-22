from rest_framework import serializers
from .models import User, UserStats, Friend
from django.core.exceptions import ValidationError

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'avatar']
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise ValidationError("This username is already taken.")
        
        if value in ['BYE', 'bye']:
            raise ValidationError("This username is not allowed.")
        forbidden_substring = "deleted_user"
        if forbidden_substring in value.lower():
            raise ValidationError(f"The username cannot contain '{forbidden_substring}'.")
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise ValidationError("This email is already taken.")
        return value
        
    def create(self, validated_data):
        password = validated_data.pop('password')
        avatar = validated_data.get('avatar', 'https://i.imgur.com/5eMAuXg.jpeg')  # Default avatar if not provided
        validated_data['avatar'] = avatar

        # Using create_user to ensure password is hashed
        user = User.objects.create_user(password=password, **validated_data)  # create_user hashes password
        return user

class UserProfileSearchSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar']

class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar', 'online_status', 'email']

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        request = self.context.get('request')
        if request and request.user != instance:
            representation.pop('email', None)
        
        return representation

class UserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['username', 'password', 'avatar', 'email']

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError("At least one field is required for update.")
        return attrs
        
    def validate_username(self, value):
        if User.objects.filter(username=value).exclude(id=self.instance.id).exists():
            raise ValidationError("This username is already taken.")
        return value
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exclude(id=self.instance.id).exists():
            raise ValidationError("This email is already taken.")
        return value

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)

        avatar = validated_data.get('avatar', None)
        if avatar:
            instance.avatar = avatar
        
        instance.username = validated_data.get('username', instance.username)

        email = validated_data.get('email', None)
        if email:
            instance.email = email

        instance.email = validated_data.get('email', instance.email)
        instance.save()
        return instance

class UserStatsSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = UserStats
        fields = ['user', 'total_matches', 'total_wins', 'total_points_scored', 
                  'total_points_against', 'current_win_streak', 'longest_win_streak',
                  'last_match_date', 'registered_at', 'tournaments_won']

class UserShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'avatar', 'online_status']

class FriendSerializer(serializers.ModelSerializer):
    user = UserShortSerializer()

    class Meta:
        model = Friend
        fields = ['user']

class TwoFactorActivationSerializer(serializers.Serializer):
    method = serializers.ChoiceField(choices=[('totp', 'TOTP'), ('sms', 'SMS'), ('email', 'Email')])
    chat_id = serializers.CharField(required=False, allow_blank=True)


