from django.contrib import admin
from django.urls import path
from django.http import JsonResponse

def api_root(request):
    return JsonResponse({"message": "Hello from Django API!"})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', api_root),
]
