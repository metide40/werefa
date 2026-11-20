from rest_framework import serializers
from .models import QueueTicket
from .services import compute_position, compute_eta_minutes


class QueueTicketSerializer(serializers.ModelSerializer):
    patientName = serializers.CharField(source='patient.full_name', read_only=True)
    phoneNumber = serializers.CharField(source='patient.phone_number', read_only=True)
    clinicId = serializers.IntegerField(source='clinic_id', read_only=True)
    clinicName = serializers.CharField(source='clinic.name', read_only=True)
    departmentId = serializers.IntegerField(source='department_id', read_only=True)
    departmentName = serializers.CharField(source='department.name', read_only=True)
    ticketNumber = serializers.CharField(source='ticket_number', read_only=True)
    joinedAt = serializers.DateTimeField(source='created_at', read_only=True)
    calledAt = serializers.DateTimeField(source='called_at', read_only=True)
    completedAt = serializers.DateTimeField(source='completed_at', read_only=True)
    estimatedWaitMins = serializers.SerializerMethodField()
    position = serializers.SerializerMethodField()
    peopleAhead = serializers.SerializerMethodField()
    # Frontend compatibility
    status = serializers.SerializerMethodField()

    class Meta:
        model = QueueTicket
        fields = [
            'id', 'ticketNumber', 'patientName', 'phoneNumber',
            'clinicId', 'clinicName', 'departmentId', 'departmentName',
            'priority', 'status', 'notes',
            'joinedAt', 'calledAt', 'completedAt',
            'estimatedWaitMins', 'position', 'peopleAhead',
        ]

    def get_status(self, obj):
        # Map SERVING -> CALLED for frontend compatibility
        if obj.status == QueueTicket.Status.SERVING:
            return 'CALLED'
        return obj.status

    def get_position(self, obj):
        return compute_position(obj)

    def get_peopleAhead(self, obj):
        pos = compute_position(obj)
        return max(0, pos - 1) if pos else 0

    def get_estimatedWaitMins(self, obj):
        return compute_eta_minutes(obj)


class JoinQueueSerializer(serializers.Serializer):
    clinic_id = serializers.IntegerField()
    department_id = serializers.IntegerField()
    full_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=40, required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    preferred_language = serializers.ChoiceField(
        choices=['en', 'am', 'om'], default='en', required=False
    )


class PriorityUpdateSerializer(serializers.Serializer):
    priority = serializers.ChoiceField(choices=['EMERGENCY', 'URGENT', 'NORMAL'])
