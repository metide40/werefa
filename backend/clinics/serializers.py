from rest_framework import serializers
from .models import Clinic, Department
from queues.models import QueueTicket


class DepartmentSerializer(serializers.ModelSerializer):
    waiting_count = serializers.SerializerMethodField()
    current_serving_number = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id', 'name', 'name_am', 'name_om', 'code', 'room_number',
            'description', 'avg_wait_mins', 'icon_name', 'is_active',
            'waiting_count', 'current_serving_number',
        ]

    def get_waiting_count(self, obj):
        return QueueTicket.objects.filter(
            department=obj, status=QueueTicket.Status.WAITING
        ).count()

    def get_current_serving_number(self, obj):
        t = QueueTicket.objects.filter(
            department=obj, status=QueueTicket.Status.SERVING
        ).order_by('-called_at').first()
        return t.ticket_number if t else None


class ClinicSerializer(serializers.ModelSerializer):
    departments = DepartmentSerializer(many=True, read_only=True)
    type = serializers.CharField(source='clinic_type', read_only=True)
    subscriptionStatus = serializers.CharField(source='subscription_status', read_only=True)
    isPartner = serializers.BooleanField(source='is_partner', read_only=True)
    activeDoctors = serializers.IntegerField(source='active_doctors', read_only=True)
    nameAm = serializers.CharField(source='name_am', read_only=True)
    nameOm = serializers.CharField(source='name_om', read_only=True)

    class Meta:
        model = Clinic
        fields = [
            'id', 'name', 'nameAm', 'nameOm', 'city', 'region', 'location',
            'phone', 'description', 'type', 'clinic_type', 'is_active',
            'isPartner', 'subscriptionStatus', 'activeDoctors', 'departments',
        ]


class ClinicListSerializer(serializers.ModelSerializer):
    departments = DepartmentSerializer(many=True, read_only=True)
    type = serializers.CharField(source='clinic_type', read_only=True)
    subscriptionStatus = serializers.CharField(source='subscription_status', read_only=True)
    isPartner = serializers.BooleanField(source='is_partner', read_only=True)
    activeDoctors = serializers.IntegerField(source='active_doctors', read_only=True)
    nameAm = serializers.CharField(source='name_am', read_only=True)
    nameOm = serializers.CharField(source='name_om', read_only=True)

    class Meta:
        model = Clinic
        fields = [
            'id', 'name', 'nameAm', 'nameOm', 'city', 'region', 'location',
            'phone', 'type', 'isPartner', 'subscriptionStatus', 'activeDoctors',
            'departments',
        ]


class ClinicCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Clinic
        fields = [
            'name', 'name_am', 'name_om', 'city', 'region', 'location',
            'phone', 'description', 'clinic_type', 'is_partner',
            'subscription_status', 'active_doctors',
        ]
