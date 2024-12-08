from django.urls import path
from .views import UserRegistrationAPIView, UserLoginAPIView, \
    UserLogoutAPIView, UserProfileAPIView, UserUpdateAPIView, \
    UserStatsAPIView, FriendshipAPIView, FriendListAPIView, \
    UserSearchAPIView, UserTokenRefreshAPIView, FriendRequestsAPIView

urlpatterns = [
    path('register/', UserRegistrationAPIView.as_view(), name='register'),
    path('login/', UserLoginAPIView.as_view(), name='login'),
    path('token-refresh/', UserTokenRefreshAPIView.as_view(), name='token-refresh'),
    path('logout/', UserLogoutAPIView.as_view(), name='logout'),
    path('search-profile/', UserSearchAPIView.as_view(), name='user-search'),
    path('profile/<int:user_id>/', UserProfileAPIView.as_view(), name='view-profile'),
    path('stats/<int:user_id>/', UserStatsAPIView.as_view(), name='view-user-stats'),
    path('update/', UserUpdateAPIView.as_view(), name='update'),
    path('friends/<int:user_id>/', FriendListAPIView.as_view(), name='friends-list'),
    path('friendship/', FriendshipAPIView.as_view(), name='friendship'),
    path('friendship-requests/', FriendRequestsAPIView.as_view(), name='friend-requests'),
]
