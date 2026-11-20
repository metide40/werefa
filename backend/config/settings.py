"""
Django settings for Werfa backend — MVP demo configuration.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get(
    'DJANGO_SECRET_KEY',
    'werfa-demo-dev-secret-change-in-production-not-for-prod'
)

DEBUG = os.environ.get('DJANGO_DEBUG', '1') == '1'

# Demo-friendly hosts: set DJANGO_ALLOWED_HOSTS or DJANGO_ALLOW_ALL_HOSTS=1 for tunnels
ALLOWED_HOSTS = [h.strip() for h in os.environ.get(
    'DJANGO_ALLOWED_HOSTS',
    'localhost,127.0.0.1,.trycloudflare.com',
).split(',') if h.strip()]
# Leading-dot subdomain matching for Cloudflare quick tunnels
if '.trycloudflare.com' not in ALLOWED_HOSTS and 'trycloudflare.com' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('.trycloudflare.com')
if os.environ.get('DJANGO_ALLOW_ALL_HOSTS', '1' if DEBUG else '0') == '1':
    ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'accounts',
    'clinics',
    'patients',
    'queues',
    'triage',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

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

WSGI_APPLICATION = 'config.wsgi.application'

# Prefer DJANGO_DB_PATH. Default to a writable path under /tmp for local demos
# (some environments cannot reliably write SQLite inside the project tree).
_default_db = os.environ.get('DJANGO_DB_PATH') or os.path.join(
    os.environ.get('TMPDIR', '/tmp'), 'werfa_db.sqlite3'
)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': _default_db,
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Addis_Ababa'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
# Built React app (npm run build → dist/) copied or linked here for single-service demo
FRONTEND_DIST = BASE_DIR.parent / 'dist'
if FRONTEND_DIST.is_dir():
    STATICFILES_DIRS = [FRONTEND_DIST]

STORAGES = {
    'default': {
        'BACKEND': 'django.core.files.storage.FileSystemStorage',
    },
    'staticfiles': {
        'BACKEND': 'whitenoise.storage.CompressedStaticFilesStorage',
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'accounts.User'

_cors = os.environ.get(
    'DJANGO_CORS_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173',
)
CORS_ALLOWED_ORIGINS = [o.strip() for o in _cors.split(',') if o.strip()]
# For campus demo / single-origin deploy you can set DJANGO_CORS_ALLOW_ALL=1
CORS_ALLOW_ALL_ORIGINS = os.environ.get('DJANGO_CORS_ALLOW_ALL', '0') == '1'
CORS_ALLOW_CREDENTIALS = True

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
}

AVERAGE_CONSULTATION_MINUTES = int(os.environ.get('AVERAGE_CONSULTATION_MINUTES', '12'))
