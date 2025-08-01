
import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import dj_database_url
import logging

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "").split(",")
CSRF_TRUSTED_ORIGINS = os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",")

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get("SECRET_KEY")
GOOGLE_GEOCODE_API = os.environ.get("GOOGLE_GEOCODE_API")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get("DEBUG")


# Application definition

INSTALLED_APPS = [
    'csp',
    'channels',
    'corsheaders',
    'storages',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'pwa',
    'core',
    'supervisor',
    'advisor',
    'workshop_manager',
    'claim_manager',
    'acm',
    'security_officer',
    'back_office_operator',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'csp.middleware.CSPMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  
    'corsheaders.middleware.CorsMiddleware',       
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'core.middleware.DeviceDetectionMiddleware',   
    'core.middleware.AutoLogoutMiddleware',        
]


ROOT_URLCONF = 'service_ambica_auto_group.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

ASGI_APPLICATION = 'service_ambica_auto_group.asgi.application'


DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL'),
        conn_max_age=0,           # 🔐 Required with pgBouncer (Transaction mode)
        ssl_require=True
    )
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Kolkata'

USE_I18N = True

USE_TZ = False


# Manually Added ################################################################################

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')   ## Add this
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'   ## Add this

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# ---------------------------------------
# DIGITALOCEAN SPACES MEDIA STORAGE
# ---------------------------------------

STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage"
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
    }
}


DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME")
AWS_S3_REGION_NAME = os.getenv("AWS_S3_REGION_NAME")  # e.g., 'blr1'
AWS_S3_ENDPOINT_URL = os.getenv("AWS_S3_ENDPOINT_URL")  # e.g., 'https://blr1.digitaloceanspaces.com'

logger = logging.getLogger(__name__)
logger.warning("### AWS_ACCESS_KEY_ID: %s", AWS_ACCESS_KEY_ID)
logger.warning("### AWS_SECRET_ACCESS_KEY: %s", AWS_SECRET_ACCESS_KEY)
logger.warning("### AWS_STORAGE_BUCKET_NAME: %s", AWS_STORAGE_BUCKET_NAME)
logger.warning("### AWS_S3_REGION_NAME: %s", AWS_S3_REGION_NAME)
logger.warning("### AWS_S3_ENDPOINT_URL: %s", AWS_S3_ENDPOINT_URL)
logger.warning("### DEFAULT_FILE_STORAGE: %s", DEFAULT_FILE_STORAGE)

# Optional: Make media files publicly accessible
AWS_QUERYSTRING_AUTH = False

# ------------------------------------------

# Allow up to 10 MB upload
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10 MB # Maximum total uploaded data file + data
FILE_UPLOAD_MAX_MEMORY_SIZE = 7 * 1024 * 1024   # 7 MB #Maximum memory size of a file


CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [os.getenv("REDIS_URL")],
            "expiry": 10,          # Message retention (seconds)
            "group_expiry": 300,   # Group membership retention (seconds)  
        },
    },
}


LOGIN_URL = 'user_login'


# Session expires after 8 hours (28800 seconds) of inactivity
SESSION_COOKIE_AGE = 28800  # 8 hours in seconds
SESSION_SAVE_EVERY_REQUEST = True  # Refresh session on every request
SESSION_EXPIRE_AT_BROWSER_CLOSE = False  # Allow session to persist on close

# For native app and also to download images because to download image blob is used so do not comment it

domain = os.getenv("DOMAIN_NAME")
if domain:
    domain = domain.strip()
    if not domain.startswith("http"):
        domain = "https://" + domain
    CORS_ALLOWED_ORIGINS = [domain]
else:
    CORS_ALLOW_ALL_ORIGINS = True


##################################################
# For PWA Installable App
PWA_APP_NAME = "CV-Service"
PWA_APP_DESCRIPTION = "CV-Service"
PWA_APP_THEME_COLOR = "#0A0A0A"
PWA_APP_BACKGROUND_COLOR = "#000000"
PWA_APP_DISPLAY = "standalone"
PWA_APP_SCOPE = "/"
PWA_APP_START_URL = "/"
PWA_APP_ORIENTATION = "any"
PWA_APP_ICONS = [
    {
        "src": "/static/core/icons/iconic_logo_192.png",
        "sizes": "192x192",
        "type": "image/png"
    },
    {
        "src": "/static/core/icons/iconic_logo_512.png",
        "sizes": "512x512",
        "type": "image/png"
    }
]
PWA_APP_DIR = "ltr"
PWA_APP_LANG = "en-US"

##################################################
# For Security

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_REFERRER_POLICY = 'same-origin'
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_BROWSER_XSS_FILTER = True

##################################################
# For CSP middleware, before this install django-csp and add its middleware
CSP_HEADER = {
    'DIRECTIVES': {
        'default-src': ("'self'",),
        'script-src': ("'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"),
        'style-src': ("'self'", "'unsafe-inline'", "https://fonts.googleapis.com"),
        'font-src': ("'self'", "https://fonts.gstatic.com"),
        'img-src': ("'self'", "data:", "blob:"),
    }
}


AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

LOGGING = {
    'version': 1,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'boto3': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'botocore': {
            'handlers': ['console'],
            'level': 'DEBUG',
        },
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    },
}
