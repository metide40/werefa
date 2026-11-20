from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        PATIENT = 'PATIENT', 'Patient'
        CLINIC_STAFF = 'CLINIC_STAFF', 'Clinic Staff'
        ADMIN = 'ADMIN', 'Administrator'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.PATIENT,
        db_index=True,
    )
    staff_clinic = models.ForeignKey(
        'clinics.Clinic',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='staff_members',
    )

    def __str__(self):
        return f'{self.get_full_name() or self.username} ({self.role})'

    @property
    def is_patient(self):
        return self.role == self.Role.PATIENT

    @property
    def is_clinic_staff(self):
        return self.role == self.Role.CLINIC_STAFF

    @property
    def is_platform_admin(self):
        return self.role == self.Role.ADMIN or self.is_superuser
