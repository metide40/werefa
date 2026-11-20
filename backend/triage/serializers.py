from rest_framework import serializers
from patients.models import Patient
from clinics.models import Department
from queues.models import QueueTicket
from .models import TriageAssessment, EmergencyCase


class TriageAssessmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    nurse_name = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)
    ticket_number = serializers.CharField(source='queue_ticket.ticket_number', read_only=True, allow_null=True)

    class Meta:
        model = TriageAssessment
        fields = [
            'id', 'patient', 'patient_name', 'clinic', 'department', 'department_name',
            'triage_nurse', 'nurse_name', 'queue_ticket', 'ticket_number',
            'presenting_complaint', 'assessment_notes', 'vital_signs',
            'priority', 'assessment_status', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'triage_nurse', 'created_at', 'updated_at']

    def get_nurse_name(self, obj):
        if not obj.triage_nurse_id:
            return None
        return obj.triage_nurse.get_full_name() or obj.triage_nurse.username


class SubmitAssessmentSerializer(serializers.Serializer):
    patient_id = serializers.IntegerField(required=False, allow_null=True)
    patient_name = serializers.CharField(required=False, allow_blank=True, max_length=150)
    phone_number = serializers.CharField(required=False, allow_blank=True, max_length=40)
    department_id = serializers.IntegerField(required=False, allow_null=True)
    queue_ticket_id = serializers.IntegerField(required=False, allow_null=True)
    presenting_complaint = serializers.CharField()
    assessment_notes = serializers.CharField(required=False, allow_blank=True)
    vital_signs = serializers.DictField(required=False)
    priority = serializers.ChoiceField(choices=['EMERGENCY', 'URGENT', 'NORMAL'])
    confirm_priority = serializers.BooleanField()
    client_request_id = serializers.CharField(required=False, allow_blank=True, max_length=64)

    def validate(self, data):
        if not data.get('confirm_priority'):
            raise serializers.ValidationError('Priority must be explicitly confirmed.')
        if data['priority'] == 'EMERGENCY' and not (data.get('presenting_complaint') or '').strip():
            raise serializers.ValidationError('Emergency assessments require a presenting complaint / reason.')
        if not data.get('patient_id') and not (data.get('patient_name') or '').strip():
            raise serializers.ValidationError('patient_id or patient_name is required.')
        return data


class EmergencyCaseSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True, allow_null=True)
    clinic_name = serializers.CharField(source='clinic.name', read_only=True)
    ticket_number = serializers.CharField(source='queue_ticket.ticket_number', read_only=True, allow_null=True)
    acknowledged_by_name = serializers.SerializerMethodField()

    class Meta:
        model = EmergencyCase
        fields = [
            'id', 'case_id', 'assessment', 'patient', 'patient_name', 'clinic', 'clinic_name',
            'department', 'department_name', 'queue_ticket', 'ticket_number',
            'status', 'emergency_reason', 'acknowledged_by', 'acknowledged_by_name',
            'acknowledged_at', 'activated_at', 'completed_at', 'sync_status',
            'created_at', 'updated_at',
        ]

    def get_acknowledged_by_name(self, obj):
        if not obj.acknowledged_by_id:
            return None
        return obj.acknowledged_by.get_full_name() or obj.acknowledged_by.username
