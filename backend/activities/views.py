# backend/activities/views.py

from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
# Use the ActivityEvent model from the existing queues app
from queues.models import ActivityEvent
from .serializers import ActivityEventSerializer
from accounts.permissions import IsPlatformAdmin

class ActivityEventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityEvent.objects.select_related('actor', 'clinic').all()
    serializer_class = ActivityEventSerializer
    permission_classes = [permissions.IsAuthenticated, IsPlatformAdmin]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields = ['message', 'actor__username', 'clinic__name']
    filterset_fields = ['event_type', 'clinic']
    ordering_fields = ['timestamp']
    pagination_class = None
    ordering = ['-timestamp']
