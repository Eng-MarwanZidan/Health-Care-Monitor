from .base import *
import os

# Production settings
DEBUG = False

# Security settings for production
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True')
SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'True')
CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE', 'True')
CSRF_TRUSTED_ORIGINS = os.getenv(
    "CSRF_TRUSTED_ORIGINS",
    "http://localhost:3000,http://localhost"
).split(",")

USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'http')


# Cache configuration for production
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'prod-cache',
    }
}

# Database configuration - add production-specific OPTIONS
DATABASES = {
    'default': {
        **DATABASES['default'],  # Inherit from base.py
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        }
    }
}

# Logging for production - more detailed
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps.healthmonitor': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

