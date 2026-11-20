# backend/health/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsPlatformAdmin
from django.db import connection
from django.conf import settings
from django.utils import timezone

class HealthCheckView(APIView):
    permission_classes = [IsAuthenticated, IsPlatformAdmin]

    def get(self, request):
        # Simple DB connection check
        try:
            connection.ensure_connection()
            db_status = 'healthy'
        except Exception:
            db_status = 'unavailable'
        # API status (this endpoint itself) is reachable
        api_status = 'healthy'
        return Response({
            'backend': api_status,
            'database': db_status,
            'last_api_response': timezone.now().isoformat(),
            'environment': getattr(settings, 'ENVIRONMENT', 'development'),
        })
