from django.conf import settings
from django.db import models


class Patient(models.Model):
    class PreferredLanguage(models.TextChoices):
        EN = 'en', 'English'
        AM = 'am', 'Amharic'
        OM = 'om', 'Afaan Oromoo'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='patient_profile',
    )
    full_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=40, blank=True, default='')
    preferred_language = models.CharField(
        max_length=5,
        choices=PreferredLanguage.choices,
        default=PreferredLanguage.EN,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.full_name
