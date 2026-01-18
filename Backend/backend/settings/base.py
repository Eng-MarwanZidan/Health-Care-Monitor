import os
from pathlib import Path
from datetime import timedelta # for JWT token lifetime settings
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent #define base directory

env_path = Path(__file__).resolve().parent.parent.parent / '.env' # Load .env file path from the project root

if os.getenv("DJANGO_ENV") != "docker":
    load_dotenv(dotenv_path=env_path)

SECRET_KEY = os.getenv('SECRET_KEY', 'replace-me') # gotenv(value in .env file, default value if not found)
DEBUG = os.getenv('DEBUG', 'True') == 'True' 
ALLOWED_HOSTS = os.getenv(
    "ALLOWED_HOSTS",
    "backend,localhost,127.0.0.1"
).split(",")


# Application definition: https://docs.djangoproject.com/en/3.2/ref/settings/#installed-apps
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # third party
    'corsheaders', # to handle CORS (cross-origin requests: requests from different domains)
    'rest_framework_simplejwt', # for JWT authentication
    'rest_framework', # DRF (Django Rest Framework)
    # local apps
    'apps.users',
    'apps.healthmonitor', 
]

# Middleware configuration : https://docs.djangoproject.com/en/3.2/topics/http/middleware/
# Middleware is a way to process requests globally before they reach the view or after the view has processed them.
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

# CORS settings: https://pypi.org/project/django-cors-headers/
CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000,http://127.0.0.1:5173').split(',')

ROOT_URLCONF = 'backend.urls' # root URL configuration module

# Template settings: https://docs.djangoproject.com/en/3.2/topics/templates/
# Templates define how the HTML output is generated
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
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

WSGI_APPLICATION = 'backend.wsgi.application'
ASGI_APPLICATION = 'backend.asgi.application'

# Database configuration: using mysql for simplicity
# Note: Can be overridden in prod.py for production-specific options
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('DB_NAME') or 'health_monitor',
        'USER': os.getenv('DB_USER') or 'root',
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT', '3306'),
    }
}

# Custom user model definition 
AUTH_USER_MODEL = 'users.User'

# Password validation settings: https://docs.djangoproject.com/en/3.2/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {
        # Ensures that the password is not too similar to the user's other attributes
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        # Ensures that the password is at least 8 characters
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        # Ensures that the password is not a common password
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',      
    },
    {
        # Ensures that the password is not entirely numeric
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },  
]

# Internationalization settings: https://docs.djangoproject.com/en/3.2/topics/i18n/
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static and media files settings: https://docs.djangoproject.com/en/3.2/howto/static-files/
STATIC_URL = '/static/'
MEDIA_URL = '/media/'
STATIC_ROOT = BASE_DIR / 'static'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type: https://docs.djangoproject.com/en/3.2/ref/settings/#default-auto-field
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# DRF and JWT configuration : https://www.django-rest-framework.org/api-guide/authentication/#json-web-token-authentication
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        # Use JWT authentication for securing API endpoints
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        # Use IsAuthenticated permission for all API endpoints by default
        'rest_framework.permissions.IsAuthenticated',
    ),
    'EXCEPTION_HANDLER': 'apps.healthmonitor.exception_handler.custom_exception_handler',
}

# JWT settings: https://dj-rest-auth.readthedocs.io/en/latest/settings.html
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'rest_framework': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'apps.healthmonitor': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',    
    },
}

# Email configuration
EMAIL_SETTINGS = {
    'EMAIL_BACKEND': os.getenv('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend'),
    'EMAIL_HOST': os.getenv('EMAIL_HOST', 'smtp.example.com'),
    'EMAIL_PORT': int(os.getenv('EMAIL_PORT', 587)),
    'EMAIL_USE_TLS': os.getenv('EMAIL_USE_TLS', 'True') == 'True',
    'EMAIL_HOST_USER': os.getenv('EMAIL_HOST_USER', ''),
    'EMAIL_HOST_PASSWORD': os.getenv('EMAIL_HOST_PASSWORD', ''),    
}   

# Apply email settings to globals
for key, value in EMAIL_SETTINGS.items():
    globals()[key] = value

# Additional settings can be added here as needed