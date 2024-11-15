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
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise ValidationError("This email is already taken.")
        return value
        
    def create(self, validated_data):
        password = validated_data.pop('password')
        avatar = validated_data.get('avatar', 'https://img.freepik.com/vecteurs-libre/homme-mafieux-mysterieux-portant-chapeau_52683-34829.jpg?t=st=1731605373~exp=1731608973~hmac=ac4171581866b46aae22583420c94f9e99b57b29d3b78d64602c459ae5a748b2&w=1380')
        validated_data['avatar'] = avatar
        
        user = User.objects.create_user(password=password, **validated_data)
        user.save()
        return user

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=255, required=True)
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            raise serializers.ValidationError("Username and password are required.")

        return data


class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(read_only=True)

    class Meta:
        model = User
        fields = ['username', 'avatar', 'online_status', 'email', 'stats']

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
        fields = ['username', 'password', 'avatar']

    def validate_username(self, value):
        if User.objects.filter(username=value).exclude(id=self.instance.id).exists():
            raise ValidationError("This username is already taken.")
        return value

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)

        avatar = validated_data.get('avatar', None)
        if avatar:
            instance.avatar = avatar
        
        instance.username = validated_data.get('username', instance.username)
        instance.save()
        return instance

class UserStatsSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = UserStats
        fields = ['user', 'total_matches', 'total_wins', 'total_losses', 
                  'win_ratio', 'total_points_scored', 'total_points_against', 
                  'last_match_date', 'registered_at', 'tournaments_won']

class FriendSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    friend = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = Friend
        fields = ['user', 'friend', 'status', 'created_at']

    def validate(self, data):
        if data['user'] == data['friend']:
            raise serializers.ValidationError("User cannot be friends with themselves.")
        
        if Friend.objects.filter(user=data['user'], friend=data['friend']).exists():
            raise serializers.ValidationError("Friendship already exists.")
        
        return data
