from django.db import models


class Clinic(models.Model):
    class ClinicType(models.TextChoices):
        REFERRAL = 'Referral & Teaching Hospital', 'Referral & Teaching Hospital'
        SPECIALIZED = 'Specialized Hospital', 'Specialized Hospital'
        PRIMARY = 'Primary Hospital', 'Primary Hospital'
        HEALTH_CENTER = 'Health Center', 'Health Center'

    name = models.CharField(max_length=200)
    name_am = models.CharField(max_length=200, blank=True, default='')
    name_om = models.CharField(max_length=200, blank=True, default='')
    city = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    location = models.CharField(max_length=255, blank=True, default='')
    phone = models.CharField(max_length=40, blank=True, default='')
    description = models.TextField(blank=True, default='')
    clinic_type = models.CharField(
        max_length=50,
        choices=ClinicType.choices,
        default=ClinicType.PRIMARY,
    )
    is_active = models.BooleanField(default=True)
    is_partner = models.BooleanField(default=True)
    subscription_status = models.CharField(max_length=20, default='active')
    active_doctors = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Department(models.Model):
    clinic = models.ForeignKey(Clinic, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=150)
    name_am = models.CharField(max_length=150, blank=True, default='')
    name_om = models.CharField(max_length=150, blank=True, default='')
    code = models.CharField(max_length=20)
    room_number = models.CharField(max_length=100, blank=True, default='')
    description = models.TextField(blank=True, default='')
    avg_wait_mins = models.PositiveIntegerField(default=12)
    icon_name = models.CharField(max_length=50, blank=True, default='Stethoscope')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['clinic', 'name']
        unique_together = [['clinic', 'code']]

    def __str__(self):
        return f'{self.clinic.name} — {self.name}'
