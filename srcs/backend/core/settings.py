from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY')
TWOFA_EMAIL = os.getenv('TWOFA_EMAIL')
TWOFA_EMAIL_PASSWORD = os.getenv('TWOFA_EMAIL_PASSWORD')
TWOFA_SERVER = os.getenv("TWOFA_SERVER")
TWOFA_SERVER_PORT = int(os.getenv("TWOFA_SERVER_PORT"))
TWOFA_BOT = os.getenv("TWOFA_BOT")
TWOFA_BOT_URL = os.getenv("TWOFA_BOT_URL")
WEBSOCKET_API_TOKEN = os.getenv('WEBSOCKET_API_TOKEN')
DEBUG = os.getenv('DJANGO_DEBUG')
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "transcendence-pong").split(",")

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

INSTALLED_APPS = [
    'games',
    'users',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'channels',
]

AUTHENTICATION_BACKENDS = [
    'users.authentication.UserAuthentication', # Custom authentication backend
]

REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated', # Default permission class means all views require authentication, so to allow unauthenticated access, we need to override this in the views (AllowAny)
    ),
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'users.authentication.AccessTokenAuthentication',  # Access token authentication
    ),
}

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'users.middleware.UpdateLastActivityMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]


ROOT_URLCONF = 'core.urls'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB'),
        'USER': os.getenv('POSTGRES_USER'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD'),
        'HOST': os.getenv('POSTGRES_HOST', 'postgres'),
        'PORT': os.getenv('POSTGRES_PORT', '5432'),
    }
}

CORS_ALLOWED_ORIGINS = [
    f"https://transcendence-pong:7443",
]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    f"https://transcendence-pong:7443",
]

ASGI_APPLICATION = 'core.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('redis', 6379)],  # Redis container name and port
        },
    },
}

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
        '__main__': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    },
}

# Redis Configuration
REDIS_HOST = 'redis'
REDIS_PORT = 6379
REDIS_DB = 0

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}',
    }
}


STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static/')

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
