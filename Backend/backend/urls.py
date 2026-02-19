# Add these URL patterns to your backend/urls.py

from django.contrib import admin
from django.urls import path, include
from apps.healthmonitor.views_health import health_check, version, metrics

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # Health check endpoints
    path('api/health/', health_check, name='health_check'),
    path('api/version/', version, name='version'),
    path('api/metrics/', metrics, name='metrics'),
    
    # API routes
    path('api/users/', include('apps.users.urls')),
    path('api/healthmonitor/', include('apps.healthmonitor.urls')),
]

# CORS configuration is handled by middleware in settings.py
