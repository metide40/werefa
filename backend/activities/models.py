# backend/activities/models.py

from django.db import models
from django.conf import settings

class ActivityEvent(models.Model):
    EVENT_CHOICES = [
        ('patient_join', 'Patient Joined Queue'),
        ('call_patient', 'Patient Called'),
        ('consult_done', 'Consultation Completed'),
        ('no_show', 'Patient No‑Show'),
        ('clinic_created', 'Clinic Created'),
        ('clinic_updated', 'Clinic Updated'),
        ('clinic_status', 'Clinic Activated/Deactivated'),
        ('staff_created', 'Staff Account Created'),
        ('staff_updated', 'Staff Account Updated'),
    ]
    event_type = models.CharField(max_length=30, choices=EVENT_CHOICES)
    description = models.TextField()
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    clinic = models.ForeignKey('clinics.Clinic', on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Activity Event'
        verbose_name_plural = 'Activity Events'
