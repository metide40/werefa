# backend/activities/serializers.py

from rest_framework import serializers
from .models import ActivityEvent

class ActivityEventSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.get_full_name', read_only=True)
    clinic_name = serializers.CharField(source='clinic.name', read_only=True)
    description = serializers.CharField(source='message', read_only=True)

    class Meta:
        model = ActivityEvent
        fields = ('id', 'event_type', 'description', 'actor_name', 'clinic_name', 'timestamp')

