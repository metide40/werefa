from django.conf import settings
from django.db import models
from django.utils import timezone


class TriageAssessment(models.Model):
    class Priority(models.TextChoices):
        EMERGENCY = 'EMERGENCY', 'Emergency'
        URGENT = 'URGENT', 'Urgent'
        NORMAL = 'NORMAL', 'Normal'

    class Status(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        SUBMITTED = 'SUBMITTED', 'Submitted'
        UPDATED = 'UPDATED', 'Updated'

    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE, related_name='triage_assessments'
    )
    clinic = models.ForeignKey(
        'clinics.Clinic', on_delete=models.CASCADE, related_name='triage_assessments'
    )
    department = models.ForeignKey(
        'clinics.Department', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='triage_assessments',
    )
    triage_nurse = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True,
        related_name='triage_assessments',
    )
    queue_ticket = models.ForeignKey(
        'queues.QueueTicket', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='triage_assessments',
    )
    presenting_complaint = models.TextField()
    assessment_notes = models.TextField(blank=True)
    vital_signs = models.JSONField(default=dict, blank=True)
    priority = models.CharField(max_length=20, choices=Priority.choices, db_index=True)
    assessment_status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.SUBMITTED, db_index=True
    )
    client_request_id = models.CharField(max_length=64, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['clinic', 'assessment_status', 'created_at']),
            models.Index(fields=['clinic', 'priority', 'created_at']),
        ]


class EmergencyCase(models.Model):
    class Status(models.TextChoices):
        REPORTED = 'REPORTED', 'Reported'
        ACKNOWLEDGED = 'ACKNOWLEDGED', 'Acknowledged'
        CARE_IN_PROGRESS = 'CARE_IN_PROGRESS', 'Care in progress'
        STABILIZED = 'STABILIZED', 'Stabilized'
        TRANSFERRED = 'TRANSFERRED', 'Transferred'
        COMPLETED = 'COMPLETED', 'Completed'

    class SyncStatus(models.TextChoices):
        SYNCED = 'SYNCED', 'Synced'
        PENDING = 'PENDING', 'Pending sync'

    case_id = models.CharField(max_length=40, unique=True, db_index=True)
    assessment = models.OneToOneField(
        TriageAssessment, on_delete=models.CASCADE, related_name='emergency_case'
    )
    patient = models.ForeignKey(
        'patients.Patient', on_delete=models.CASCADE, related_name='emergency_cases'
    )
    clinic = models.ForeignKey(
        'clinics.Clinic', on_delete=models.CASCADE, related_name='emergency_cases'
    )
    department = models.ForeignKey(
        'clinics.Department', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='emergency_cases',
    )
    queue_ticket = models.ForeignKey(
        'queues.QueueTicket', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='emergency_cases',
    )
    status = models.CharField(
        max_length=30, choices=Status.choices, default=Status.REPORTED, db_index=True
    )
    emergency_reason = models.TextField(blank=True)
    acknowledged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='acknowledged_emergencies',
    )
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    activated_at = models.DateTimeField(default=timezone.now, db_index=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    sync_status = models.CharField(
        max_length=20, choices=SyncStatus.choices, default=SyncStatus.SYNCED
    )
    client_request_id = models.CharField(max_length=64, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-activated_at']


class QueueInterruption(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        EMERGENCY_INTERRUPTION = 'EMERGENCY_INTERRUPTION', 'Emergency interruption'
        RESUMING = 'RESUMING', 'Resuming'
        PAUSED_BY_STAFF = 'PAUSED_BY_STAFF', 'Paused by staff'
        ENDED = 'ENDED', 'Ended'

    clinic = models.ForeignKey(
        'clinics.Clinic', on_delete=models.CASCADE, related_name='queue_interruptions'
    )
    department = models.ForeignKey(
        'clinics.Department', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='queue_interruptions',
    )
    emergency_case = models.ForeignKey(
        EmergencyCase, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='interruptions',
    )
    interruption_reason = models.CharField(max_length=255, blank=True)
    status = models.CharField(
        max_length=30, choices=Status.choices,
        default=Status.EMERGENCY_INTERRUPTION, db_index=True,
    )
    started_at = models.DateTimeField(default=timezone.now)
    ended_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, on_delete=models.SET_NULL,
        related_name='created_interruptions',
    )
    resumed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
        related_name='resumed_interruptions',
    )

    class Meta:
        ordering = ['-started_at']
