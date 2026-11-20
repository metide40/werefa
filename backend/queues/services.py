"""Queue ordering, position, ETA, and staff clinic scoping."""
from django.conf import settings
from django.db import transaction
from rest_framework import status
from rest_framework.response import Response

from .models import QueueTicket


def waiting_queryset(clinic=None, department=None):
    qs = QueueTicket.objects.filter(status=QueueTicket.Status.WAITING)
    if clinic is not None:
        qs = qs.filter(clinic=clinic)
    if department is not None:
        qs = qs.filter(department=department)
    return qs


def sort_key(ticket):
    return (
        QueueTicket.PRIORITY_ORDER.get(ticket.priority, 99),
        ticket.created_at,
    )


def ordered_waiting(clinic=None, department=None):
    tickets = list(waiting_queryset(clinic, department))
    tickets.sort(key=sort_key)
    return tickets


def compute_position(ticket):
    """1-based position among waiting tickets in same clinic+department."""
    if ticket.status != QueueTicket.Status.WAITING:
        return 0
    waiting = ordered_waiting(clinic=ticket.clinic, department=ticket.department)
    for i, t in enumerate(waiting, start=1):
        if t.id == ticket.id:
            return i
    return 0


def compute_eta_minutes(ticket):
    """Estimate based on people ahead × average consultation minutes."""
    pos = compute_position(ticket)
    if pos <= 0:
        return 0
    avg = getattr(settings, 'AVERAGE_CONSULTATION_MINUTES', 12)
    if ticket.department and ticket.department.avg_wait_mins:
        avg = ticket.department.avg_wait_mins
    people_ahead = max(0, pos - 1)
    return people_ahead * avg


def generate_ticket_number(clinic, department):
    prefix = (clinic.name[:4] if clinic.name else 'WRF').upper().replace(' ', '')
    code = department.code or 'GEN'
    # Retry-safe unique number
    count = QueueTicket.objects.filter(clinic=clinic, department=department).count() + 1
    for _ in range(20):
        candidate = f'{prefix}-{code}-{count:03d}'
        if not QueueTicket.objects.filter(ticket_number=candidate).exists():
            return candidate
        count += 1
    # Extremely unlikely fallback
    import uuid
    return f'{prefix}-{code}-{uuid.uuid4().hex[:6].upper()}'


def staff_clinic_or_403(request):
    """
    Resolve the clinic a staff user may operate on.
    - Clinic staff: always their assigned staff_clinic (ignore client clinic_id).
    - Platform admin: may pass clinic_id; otherwise first active clinic.
    Returns (clinic, error_response_or_None).
    """
    user = request.user
    if getattr(user, 'is_platform_admin', False) or user.is_superuser:
        clinic_id = (
            request.query_params.get('clinic_id')
            if hasattr(request, 'query_params')
            else None
        )
        if clinic_id is None and hasattr(request, 'data'):
            clinic_id = request.data.get('clinic_id')
        if clinic_id:
            from clinics.models import Clinic
            try:
                return Clinic.objects.get(pk=clinic_id), None
            except Clinic.DoesNotExist:
                return None, Response({'detail': 'Clinic not found.'}, status=status.HTTP_404_NOT_FOUND)
        from clinics.models import Clinic
        clinic = Clinic.objects.filter(is_active=True).first()
        if not clinic:
            return None, Response({'detail': 'No clinic available.'}, status=status.HTTP_404_NOT_FOUND)
        return clinic, None

    clinic = getattr(user, 'staff_clinic', None)
    if clinic is None:
        return None, Response(
            {'detail': 'No clinic assigned to this staff account.'},
            status=status.HTTP_403_FORBIDDEN,
        )
    return clinic, None


@transaction.atomic
def call_next_patient(clinic, department=None):
    """
    Call the next eligible waiting patient for the clinic (and optional department).
    Only one transition WAITING -> SERVING per call; uses row locking.
    """
    waiting = ordered_waiting(clinic=clinic, department=department)
    if not waiting:
        return None
    ticket = (
        QueueTicket.objects.select_for_update()
        .filter(pk=waiting[0].pk, status=QueueTicket.Status.WAITING)
        .first()
    )
    if ticket is None:
        return None
    ticket.mark_serving()
    return ticket
