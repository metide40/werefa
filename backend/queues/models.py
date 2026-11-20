from django.db import models
from django.utils import timezone


class QueueTicket(models.Model):
    class Priority(models.TextChoices):
        EMERGENCY = 'EMERGENCY', 'Emergency'
        URGENT = 'URGENT', 'Urgent'
        NORMAL = 'NORMAL', 'Normal'

    class Status(models.TextChoices):
        WAITING = 'WAITING', 'Waiting'
        SERVING = 'SERVING', 'Serving'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        NO_SHOW = 'NO_SHOW', 'No Show'

    PRIORITY_ORDER = {
        Priority.EMERGENCY: 0,
        Priority.URGENT: 1,
        Priority.NORMAL: 2,
    }

    ticket_number = models.CharField(max_length=40, unique=True, db_index=True)
    patient = models.ForeignKey(
        'patients.Patient',
        on_delete=models.CASCADE,
        related_name='tickets',
    )
    clinic = models.ForeignKey(
        'clinics.Clinic',
        on_delete=models.CASCADE,
        related_name='tickets',
    )
    department = models.ForeignKey(
        'clinics.Department',
        on_delete=models.CASCADE,
        related_name='tickets',
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.NORMAL,
        db_index=True,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.WAITING,
        db_index=True,
    )
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    called_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['clinic', 'department', 'status', 'priority', 'created_at']),
        ]

    def __str__(self):
        return f'{self.ticket_number} ({self.status})'

    def mark_serving(self):
        self.status = self.Status.SERVING
        self.called_at = timezone.now()
        self.save(update_fields=['status', 'called_at'])

    def mark_completed(self):
        self.status = self.Status.COMPLETED
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at'])

    def mark_no_show(self):
        self.status = self.Status.NO_SHOW
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at'])

    def mark_cancelled(self):
        self.status = self.Status.CANCELLED
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at'])
