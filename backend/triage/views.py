from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsTriageNurse, IsClinicStaff, IsPlatformAdmin
from clinics.models import Department
from patients.models import Patient
from queues.models import QueueTicket
from queues.services import staff_clinic_or_403, generate_ticket_number
from .models import TriageAssessment, EmergencyCase, QueueInterruption
from .serializers import (
    TriageAssessmentSerializer, SubmitAssessmentSerializer, EmergencyCaseSerializer,
)
from .services import submit_assessment, acknowledge_emergency, update_emergency_status, staff_clinic


def _clinic_for(request):
    user = request.user
    if user.role == 'ADMIN' or user.is_superuser:
        clinic_id = request.query_params.get('clinic_id') or request.data.get('clinic_id')
        if clinic_id:
            from clinics.models import Clinic
            return Clinic.objects.filter(pk=clinic_id).first()
        return user.staff_clinic
    return user.staff_clinic


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTriageNurse])
def triage_overview(request):
    clinic = _clinic_for(request)
    if not clinic and request.user.role != 'ADMIN':
        return Response({'detail': 'No clinic assigned.'}, status=status.HTTP_403_FORBIDDEN)
    qs = QueueTicket.objects.all()
    assessments = TriageAssessment.objects.all()
    emergencies = EmergencyCase.objects.all()
    if clinic:
        qs = qs.filter(clinic=clinic)
        assessments = assessments.filter(clinic=clinic)
        emergencies = emergencies.filter(clinic=clinic)
    today = timezone.localdate()
    pending = qs.filter(status=QueueTicket.Status.WAITING, priority=QueueTicket.Priority.NORMAL).count()
    # awaiting triage: waiting tickets without submitted assessment today
    assessed_ticket_ids = assessments.filter(
        created_at__date=today, assessment_status=TriageAssessment.Status.SUBMITTED
    ).values_list('queue_ticket_id', flat=True)
    awaiting = qs.filter(status=QueueTicket.Status.WAITING).exclude(id__in=assessed_ticket_ids).count()
    return Response({
        'clinic_id': clinic.id if clinic else None,
        'clinic_name': clinic.name if clinic else 'All clinics',
        'awaiting_triage': awaiting,
        'assessed_today': assessments.filter(created_at__date=today).count(),
        'active_emergencies': emergencies.exclude(
            status__in=[EmergencyCase.Status.COMPLETED, EmergencyCase.Status.TRANSFERRED]
        ).count(),
        'urgent_waiting': qs.filter(status=QueueTicket.Status.WAITING, priority=QueueTicket.Priority.URGENT).count(),
        'emergency_waiting': qs.filter(status=QueueTicket.Status.WAITING, priority=QueueTicket.Priority.EMERGENCY).count(),
        'normal_waiting': qs.filter(status=QueueTicket.Status.WAITING, priority=QueueTicket.Priority.NORMAL).count(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTriageNurse])
def triage_pending(request):
    clinic = _clinic_for(request)
    if not clinic and request.user.role != 'ADMIN':
        return Response({'detail': 'No clinic assigned.'}, status=status.HTTP_403_FORBIDDEN)
    qs = QueueTicket.objects.filter(status=QueueTicket.Status.WAITING).select_related(
        'patient', 'department', 'clinic'
    )
    if clinic:
        qs = qs.filter(clinic=clinic)
    assessed = set(
        TriageAssessment.objects.filter(
            queue_ticket_id__in=qs.values_list('id', flat=True),
            assessment_status=TriageAssessment.Status.SUBMITTED,
        ).values_list('queue_ticket_id', flat=True)
    )
    rows = []
    for t in qs.order_by('created_at')[:100]:
        rows.append({
            'ticket_id': t.id,
            'ticket_number': t.ticket_number,
            'patient_id': t.patient_id,
            'patient_name': t.patient.full_name,
            'department_id': t.department_id,
            'department_name': t.department.name,
            'clinic_id': t.clinic_id,
            'priority': t.priority,
            'status': t.status,
            'joined_at': t.created_at,
            'assessed': t.id in assessed,
        })
    return Response(rows)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsTriageNurse])
def create_assessment(request):
    ser = SubmitAssessmentSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    data = ser.validated_data
    user = request.user
    # Refresh user clinic from DB (avoid stale in-memory assignment)
    user = type(user).objects.select_related('staff_clinic').get(pk=user.pk)
    clinic = user.staff_clinic

    # Prefer clinic from existing ticket when provided
    if data.get('queue_ticket_id'):
        ticket_probe = QueueTicket.objects.select_related('clinic').filter(pk=data['queue_ticket_id']).first()
        if ticket_probe:
            if user.role != 'ADMIN' and user.staff_clinic_id and ticket_probe.clinic_id != user.staff_clinic_id:
                return Response({'detail': 'Ticket is not in your assigned clinic.'}, status=status.HTTP_403_FORBIDDEN)
            clinic = ticket_probe.clinic

    if not clinic and user.role in ('ADMIN',) and request.data.get('clinic_id'):
        from clinics.models import Clinic
        clinic = Clinic.objects.filter(pk=request.data['clinic_id']).first()

    if not clinic and user.role != 'ADMIN':
        return Response(
            {'detail': 'No clinic assigned to this triage account. Ask an admin to set staff_clinic, then sign in again.'},
            status=status.HTTP_403_FORBIDDEN,
        )
    if not clinic:
        return Response({'detail': 'Clinic required. Provide clinic_id or use an account with an assigned clinic.'}, status=status.HTTP_400_BAD_REQUEST)

    # Resolve patient
    if data.get('patient_id'):
        try:
            patient = Patient.objects.get(pk=data['patient_id'])
        except Patient.DoesNotExist:
            return Response({'detail': 'Patient not found.'}, status=status.HTTP_404_NOT_FOUND)
    else:
        patient = Patient.objects.create(
            full_name=data['patient_name'].strip(),
            phone_number=data.get('phone_number') or '',
        )

    department = None
    if data.get('department_id'):
        department = Department.objects.filter(pk=data['department_id'], clinic=clinic).first()
        if not department:
            return Response({'detail': 'Department not in your clinic.'}, status=status.HTTP_400_BAD_REQUEST)

    ticket = None
    if data.get('queue_ticket_id'):
        ticket = QueueTicket.objects.filter(pk=data['queue_ticket_id'], clinic=clinic).first()
        if not ticket:
            return Response({'detail': 'Ticket not found in your clinic.'}, status=status.HTTP_404_NOT_FOUND)
    elif department:
        # Walk-in: create waiting ticket at NORMAL first if none provided; priority applied by assessment
        tn = generate_ticket_number(clinic, department)
        ticket = QueueTicket.objects.create(
            ticket_number=tn,
            patient=patient,
            clinic=clinic,
            department=department,
            priority=QueueTicket.Priority.NORMAL,
            status=QueueTicket.Status.WAITING,
            notes='Created from triage assessment',
        )

    assessment, emergency, created = submit_assessment(
        nurse=user,
        patient=patient,
        clinic=clinic,
        department=department or (ticket.department if ticket else None),
        presenting_complaint=data['presenting_complaint'],
        assessment_notes=data.get('assessment_notes', ''),
        vital_signs=data.get('vital_signs'),
        priority=data['priority'],
        queue_ticket=ticket,
        client_request_id=data.get('client_request_id') or '',
    )
    payload = {
        'assessment': TriageAssessmentSerializer(assessment).data,
        'emergency': EmergencyCaseSerializer(emergency).data if emergency else None,
        'created': created,
    }
    return Response(payload, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsTriageNurse])
def list_assessments(request):
    clinic = _clinic_for(request)
    qs = TriageAssessment.objects.select_related('patient', 'department', 'triage_nurse', 'queue_ticket')
    if clinic:
        qs = qs.filter(clinic=clinic)
    return Response(TriageAssessmentSerializer(qs[:100], many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsClinicStaff])
def list_emergencies(request):
    clinic = _clinic_for(request)
    qs = EmergencyCase.objects.select_related('patient', 'department', 'clinic', 'queue_ticket', 'acknowledged_by')
    if clinic:
        qs = qs.filter(clinic=clinic)
    status_f = request.query_params.get('status')
    if status_f:
        qs = qs.filter(status=status_f.upper())
    active = request.query_params.get('active')
    if active == 'true':
        qs = qs.exclude(status__in=[EmergencyCase.Status.COMPLETED, EmergencyCase.Status.TRANSFERRED])
    return Response(EmergencyCaseSerializer(qs[:100], many=True).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsClinicStaff])
def acknowledge_emergency_view(request, pk):
    try:
        emergency = EmergencyCase.objects.select_related('clinic').get(pk=pk)
    except EmergencyCase.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    user = request.user
    if user.role != 'ADMIN' and user.staff_clinic_id != emergency.clinic_id:
        return Response({'detail': 'Not your clinic.'}, status=status.HTTP_403_FORBIDDEN)
    emergency = acknowledge_emergency(emergency, user)
    return Response(EmergencyCaseSerializer(emergency).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsClinicStaff])
def emergency_status_view(request, pk):
    try:
        emergency = EmergencyCase.objects.select_related('clinic').get(pk=pk)
    except EmergencyCase.DoesNotExist:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    user = request.user
    if user.role != 'ADMIN' and user.staff_clinic_id != emergency.clinic_id:
        return Response({'detail': 'Not your clinic.'}, status=status.HTTP_403_FORBIDDEN)
    new_status = (request.data.get('status') or '').upper()
    valid = {c.value for c in EmergencyCase.Status}
    if new_status not in valid:
        return Response({'detail': f'Invalid status. Choose from {sorted(valid)}'}, status=status.HTTP_400_BAD_REQUEST)
    emergency = update_emergency_status(emergency, user, new_status)
    return Response(EmergencyCaseSerializer(emergency).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPlatformAdmin])
def admin_emergencies(request):
    from django.db.models import Count
    from queues.models import ActivityEvent

    qs = EmergencyCase.objects.select_related('patient', 'clinic', 'department')
    clinic_id = request.query_params.get('clinic_id')
    status_f = request.query_params.get('status')
    date_from = request.query_params.get('from')
    date_to = request.query_params.get('to')
    if clinic_id:
        qs = qs.filter(clinic_id=clinic_id)
    if status_f:
        qs = qs.filter(status=status_f.upper())
    if date_from:
        qs = qs.filter(activated_at__date__gte=date_from)
    if date_to:
        qs = qs.filter(activated_at__date__lte=date_to)

    active = qs.exclude(status__in=[EmergencyCase.Status.COMPLETED, EmergencyCase.Status.TRANSFERRED]).count()
    total = qs.count()
    completed = qs.filter(status=EmergencyCase.Status.COMPLETED).count()

    by_clinic = list(
        qs.values('clinic_id', 'clinic__name').annotate(count=Count('id')).order_by('-count')
    )
    by_department = list(
        qs.values('department_id', 'department__name').annotate(count=Count('id')).order_by('-count')
    )

    # Priority change audit (human review indicators only)
    priority_events = ActivityEvent.objects.filter(event_type=ActivityEvent.EventType.PRIORITY)
    if clinic_id:
        priority_events = priority_events.filter(clinic_id=clinic_id)
    priority_events = priority_events.select_related('actor', 'clinic').order_by('-created_at')[:50]
    audit = [
        {
            'id': e.id,
            'message': e.message,
            'actor': e.actor.get_full_name() if e.actor_id else None,
            'clinic': e.clinic.name if e.clinic_id else None,
            'created_at': e.created_at,
            'metadata': e.metadata,
        }
        for e in priority_events
    ]

    # Unusual: same actor with many priority changes in 24h (indicator only)
    from django.utils import timezone
    from datetime import timedelta
    since = timezone.now() - timedelta(hours=24)
    recent = (
        ActivityEvent.objects.filter(event_type=ActivityEvent.EventType.PRIORITY, created_at__gte=since)
        .values('actor_id', 'actor__username')
        .annotate(count=Count('id'))
        .filter(count__gte=5)
        .order_by('-count')
    )
    review_indicators = [
        {
            'type': 'high_priority_change_volume',
            'actor_id': r['actor_id'],
            'actor': r['actor__username'],
            'count_24h': r['count'],
            'note': 'Review indicator only — not an automatic accusation.',
        }
        for r in recent
    ]

    return Response({
        'total': total,
        'active': active,
        'completed': completed,
        'by_clinic': by_clinic,
        'by_department': by_department,
        'audit_priority_changes': audit,
        'review_indicators': review_indicators,
        'results': EmergencyCaseSerializer(qs.order_by('-activated_at')[:100], many=True).data,
    })
