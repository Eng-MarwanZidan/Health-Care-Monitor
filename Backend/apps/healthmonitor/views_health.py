from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import os


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint for monitoring
    Returns application status and database connectivity
    """
    try:
        # Check database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        db_status = "healthy"
        db_response_time = "OK"
    except Exception as e:
        db_status = "unhealthy"
        db_response_time = str(e)
    
    health_status = {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "timestamp": __import__('datetime').datetime.now().isoformat(),
        "version": "1.0.0",
        "environment": os.getenv('DJANGO_SETTINGS_MODULE', 'unknown'),
        "debug": os.getenv('DEBUG', 'False') == 'True',
        "database": {
            "status": db_status,
            "response_time": db_response_time
        },
        "checks": {
            "database": True if db_status == "healthy" else False,
            "api": True,
        }
    }
    
    status_code = status.HTTP_200_OK if db_status == "healthy" else status.HTTP_503_SERVICE_UNAVAILABLE
    return Response(health_status, status=status_code)


@api_view(['GET'])
@permission_classes([AllowAny])
def version(request):
    """Version endpoint"""
    return Response({
        "version": "1.0.0",
        "api_version": "v1",
        "environment": os.getenv('DJANGO_SETTINGS_MODULE', 'unknown'),
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def metrics(request):
    """Basic metrics endpoint"""
    from django.core.cache import cache
    from django.db.models import Count
    from apps.users.models import User
    from apps.healthmonitor.models import Measurement  # Adjust import as needed
    
    metrics_data = {
        "users": {
            "total": User.objects.count(),
            "active": User.objects.filter(is_active=True).count(),
        },
        "cache": {
            "status": "available" if cache else "unavailable",
        },
        "timestamp": __import__('datetime').datetime.now().isoformat(),
    }
    
    return Response(metrics_data)
