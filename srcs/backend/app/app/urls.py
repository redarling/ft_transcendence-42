from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({"message": "Hello from Django API!"})

urlpatterns = [
    path('api/', api_root),
    path('api/admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/games/', include('games.urls')),
]

