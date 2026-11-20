from django.db import transaction
from django.utils import timezone

from queues.models import QueueTicket, ActivityEvent
from queues.activity import log_activity
from .models import TriageAssessment, EmergencyCase, QueueInterruption


def generate_emergency_case_id(clinic) -> str:
    prefix = ''.join([c for c in clinic.name.upper() if c.isalnum()][:3]) or 'EMG'
    day = timezone.localdate().strftime('%y%m%d')
    count = EmergencyCase.objects.filter(clinic=clinic, activated_at__date=timezone.localdate()).count() + 1
    return f'E-{prefix}-{day}-{count:03d}'


@transaction.atomic
def submit_assessment(
    *,
    nurse,
    patient,
    clinic,
    department,
    presenting_complaint,
    assessment_notes='',
    vital_signs=None,
    priority,
    queue_ticket=None,
    client_request_id='',
):
    """Create triage assessment; activate emergency workflow when priority is EMERGENCY."""
    if client_request_id:
        existing = TriageAssessment.objects.filter(
            clinic=clinic, client_request_id=client_request_id
        ).first()
        if existing:
            return existing, getattr(existing, 'emergency_case', None), False

    assessment = TriageAssessment.objects.create(
        patient=patient,
        clinic=clinic,
        department=department,
        triage_nurse=nurse,
        queue_ticket=queue_ticket,
        presenting_complaint=presenting_complaint,
        assessment_notes=assessment_notes or '',
        vital_signs=vital_signs or {},
        priority=priority,
        assessment_status=TriageAssessment.Status.SUBMITTED,
        client_request_id=client_request_id or '',
    )

    # Apply priority to linked ticket
    if queue_ticket and queue_ticket.priority != priority:
        old = queue_ticket.priority
        queue_ticket.priority = priority
        queue_ticket.save(update_fields=['priority', 'updated_at'] if hasattr(queue_ticket, 'updated_at') else ['priority'])
        log_activity(
            event_type=ActivityEvent.EventType.PRIORITY,
            message=f'Priority {old} → {priority} via triage for {queue_ticket.ticket_number}',
            actor=nurse,
            clinic=clinic,
            ticket=queue_ticket,
            metadata={'previous': old, 'new': priority},
        )

    emergency = None
    if priority == TriageAssessment.Priority.EMERGENCY:
        emergency = activate_emergency(
            assessment=assessment,
            nurse=nurse,
            reason=presenting_complaint,
            client_request_id=client_request_id,
        )

    log_activity(
        event_type='JOIN',
        message=f'Triage assessment submitted ({priority}) for patient {patient.id}',
        actor=nurse,
        clinic=clinic,
        ticket=queue_ticket,
        metadata={'assessment_id': assessment.id, 'priority': priority},
    )
    return assessment, emergency, True


@transaction.atomic
def activate_emergency(*, assessment, nurse, reason='', client_request_id=''):
    clinic = assessment.clinic
    case_id = generate_emergency_case_id(clinic)
    emergency = EmergencyCase.objects.create(
        case_id=case_id,
        assessment=assessment,
        patient=assessment.patient,
        clinic=clinic,
        department=assessment.department,
        queue_ticket=assessment.queue_ticket,
        status=EmergencyCase.Status.REPORTED,
        emergency_reason=reason or assessment.presenting_complaint,
        activated_at=timezone.now(),
        sync_status=EmergencyCase.SyncStatus.SYNCED,
        client_request_id=client_request_id or '',
    )

    # Interruption record
    QueueInterruption.objects.create(
        clinic=clinic,
        department=assessment.department,
        emergency_case=emergency,
        interruption_reason='Emergency assessment activated',
        status=QueueInterruption.Status.EMERGENCY_INTERRUPTION,
        created_by=nurse,
    )

    # Promote ticket to emergency priority; keep original timestamps
    ticket = assessment.queue_ticket
    if ticket and ticket.status == QueueTicket.Status.WAITING:
        ticket.priority = QueueTicket.Priority.EMERGENCY
        ticket.save(update_fields=['priority'])

    log_activity(
        event_type='CALL',
        message=f'Emergency activated {case_id}',
        actor=nurse,
        clinic=clinic,
        ticket=ticket,
        metadata={'emergency_case_id': case_id},
    )
    return emergency


@transaction.atomic
def acknowledge_emergency(emergency, staff):
    emergency.status = EmergencyCase.Status.ACKNOWLEDGED
    emergency.acknowledged_by = staff
    emergency.acknowledged_at = timezone.now()
    emergency.save(update_fields=['status', 'acknowledged_by', 'acknowledged_at', 'updated_at'])
    log_activity(
        event_type='CALL',
        message=f'Emergency {emergency.case_id} acknowledged',
        actor=staff,
        clinic=emergency.clinic,
        ticket=emergency.queue_ticket,
    )
    return emergency


@transaction.atomic
def update_emergency_status(emergency, staff, new_status):
    emergency.status = new_status
    if new_status in (
        EmergencyCase.Status.COMPLETED,
        EmergencyCase.Status.TRANSFERRED,
        EmergencyCase.Status.STABILIZED,
    ):
        emergency.completed_at = timezone.now()
        # End active interruptions
        QueueInterruption.objects.filter(
            emergency_case=emergency,
            ended_at__isnull=True,
        ).update(
            ended_at=timezone.now(),
            status=QueueInterruption.Status.ENDED,
            resumed_by=staff,
        )
    emergency.save()
    log_activity(
        event_type='COMPLETE',
        message=f'Emergency {emergency.case_id} → {new_status}',
        actor=staff,
        clinic=emergency.clinic,
        ticket=emergency.queue_ticket,
    )
    return emergency


def staff_clinic(user):
    if user.role == 'ADMIN' or user.is_superuser:
        return None  # platform-wide
    return user.staff_clinic
