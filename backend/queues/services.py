"""Queue ordering, position, ETA, and staff clinic scoping."""
from django.conf import settings
from django.db import transaction
from django.utils import timezone
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


def active_emergency_interruption(clinic, department=None):
    """Return active emergency interruption for clinic (optional department)."""
    try:
        from triage.models import QueueInterruption, EmergencyCase
    except Exception:
        return None
    qs = QueueInterruption.objects.filter(
        clinic=clinic,
        ended_at__isnull=True,
        status=QueueInterruption.Status.EMERGENCY_INTERRUPTION,
    ).select_related('emergency_case')
    if department is not None:
        qs = qs.filter(department_id__in=[department.id, None])
    return qs.order_by('-started_at').first()


def compute_eta_minutes(ticket):
    """
    Estimate based on people ahead × average consultation minutes.
    When an active emergency interruption exists, add a clinic-configurable buffer
    (default 20 minutes). Never presented as a guarantee.
    """
    pos = compute_position(ticket)
    if pos <= 0:
        return 0
    avg = getattr(settings, 'AVERAGE_CONSULTATION_MINUTES', 12)
    if ticket.department and ticket.department.avg_wait_mins:
        avg = ticket.department.avg_wait_mins
    people_ahead = max(0, pos - 1)
    base = people_ahead * avg

    interruption = active_emergency_interruption(ticket.clinic, ticket.department)
    emergency_buffer = 0
    if interruption and ticket.priority != QueueTicket.Priority.EMERGENCY:
        emergency_buffer = int(getattr(settings, 'EMERGENCY_ETA_BUFFER_MINUTES', 20))
    return base + emergency_buffer


def eta_context(ticket):
    """Extra patient-safe messaging around ETA changes due to emergencies."""
    interruption = active_emergency_interruption(ticket.clinic, ticket.department)
    if interruption and ticket.status == QueueTicket.Status.WAITING and ticket.priority != QueueTicket.Priority.EMERGENCY:
        return {
            'queueInterrupted': True,
            'interruptionReason': 'emergency_priority',
            'messageKey': 'patient.ticket.emergencyDelayNotice',
            'message': (
                'An emergency case is currently receiving priority attention. '
                'Your estimated waiting time has been updated. Thank you for your understanding.'
            ),
            'etaIsEstimateOnly': True,
        }
    return {
        'queueInterrupted': False,
        'interruptionReason': None,
        'messageKey': None,
        'message': None,
        'etaIsEstimateOnly': True,
    }


def generate_ticket_number(clinic, department):
    prefix = (clinic.name[:4] if clinic.name else 'WRF').upper().replace(' ', '')
    code = department.code or 'GEN'
    count = QueueTicket.objects.filter(clinic=clinic, department=department).count() + 1
    for _ in range(20):
        candidate = f'{prefix}-{code}-{count:03d}'
        if not QueueTicket.objects.filter(ticket_number=candidate).exists():
            return candidate
        count += 1
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
    """Call next eligible waiting patient (priority then FIFO)."""
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
