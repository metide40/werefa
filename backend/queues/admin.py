from django.contrib import admin
from .models import QueueTicket

@admin.register(QueueTicket)
class QueueTicketAdmin(admin.ModelAdmin):
    list_display = ['ticket_number', 'patient', 'clinic', 'department', 'priority', 'status', 'created_at']
    list_filter = ['status', 'priority', 'clinic']
