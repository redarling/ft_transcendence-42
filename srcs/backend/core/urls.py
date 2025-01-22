from django.urls import path, include

urlpatterns = [
    path('api/users/', include('users.urls')),
    path('api/games/', include('games.urls')),
]

