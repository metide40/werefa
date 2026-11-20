from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from accounts.permissions import IsClinicStaff
from clinics.models import Clinic, Department
from patients.models import Patient
from .models import QueueTicket
from .serializers import QueueTicketSerializer, JoinQueueSerializer, PriorityUpdateSerializer
from .services import (
    call_next_patient,
    generate_ticket_number,
    compute_position,
    compute_eta_minutes,
    staff_clinic_or_403,
)


def _ticket_owner(request, ticket) -> bool:
    """True if the request user owns this ticket."""
    user = request.user
    if not user or not user.is_authenticated:
        return False
    if getattr(user, 'is_platform_admin', False) or user.is_superuser:
        return True
    if getattr(user, 'is_clinic_staff', False):
        return ticket.clinic_id == getattr(user.staff_clinic, 'id', None)
    patient = getattr(user, 'patient_profile', None)
    return bool(patient and ticket.patient_id == patient.id)


def _public_ticket_payload(ticket):
    """Minimum public fields for position tracking — no name/phone."""
    status_val = 'CALLED' if ticket.status == QueueTicket.Status.SERVING else ticket.status
    return {
        'id': ticket.id,
        'ticketNumber': ticket.ticket_number,
        'clinicId': ticket.clinic_id,
        'clinicName': ticket.clinic.name,
        'departmentId': ticket.department_id,
        'departmentName': ticket.department.name,
        'priority': ticket.priority,
        'status': status_val,
        'position': compute_position(ticket),
        'peopleAhead': max(0, compute_position(ticket) - 1) if ticket.status == QueueTicket.Status.WAITING else 0,
        'estimatedWaitMins': compute_eta_minutes(ticket),
        'joinedAt': ticket.created_at,
        'note': 'ETA is an estimate, not a guarantee. Personal details are not exposed on public endpoints.',
    }


@api_view(['POST'])
@permission_classes([AllowAny])
def join_queue(request):
    """Patient joins a clinic department queue."""
    ser = JoinQueueSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    data = ser.validated_data

    clinic = get_object_or_404(Clinic, pk=data['clinic_id'], is_active=True)
    department = get_object_or_404(
        Department, pk=data['department_id'], clinic=clinic, is_active=True
    )

    with transaction.atomic():
        patient = None
        if request.user and request.user.is_authenticated:
            patient = getattr(request.user, 'patient_profile', None)

        if patient is None:
            patient = Patient.objects.create(
                full_name=data['full_name'],
                phone_number=data.get('phone_number', ''),
                preferred_language=data.get('preferred_language', 'en'),
                user=request.user if request.user.is_authenticated else None,
            )
        else:
            if data.get('full_name'):
                patient.full_name = data['full_name']
            if data.get('phone_number') is not None:
                patient.phone_number = data['phone_number']
            patient.save()

        existing = (
            QueueTicket.objects.select_for_update()
            .filter(
                patient=patient,
                department=department,
                status__in=[QueueTicket.Status.WAITING, QueueTicket.Status.SERVING],
            )
            .first()
        )
        if existing:
            return Response(
                {
                    'detail': 'You already have an active ticket in this department.',
                    'ticket': QueueTicketSerializer(existing).data,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        ticket_number = generate_ticket_number(clinic, department)
        ticket = QueueTicket.objects.create(
            ticket_number=ticket_number,
            patient=patient,
            clinic=clinic,
            department=department,
            priority=QueueTicket.Priority.NORMAL,
            notes=data.get('notes', ''),
        )

    return Response(QueueTicketSerializer(ticket).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_tickets(request):
    patient = getattr(request.user, 'patient_profile', None)
    if not patient:
        return Response([])
    tickets = (
        QueueTicket.objects.filter(patient=patient)
        .select_related('clinic', 'department', 'patient')
        .order_by('-created_at')[:20]
    )
    return Response(QueueTicketSerializer(tickets, many=True).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def ticket_detail(request, pk):
    """
    Public: minimal position info only.
    Owner / staff / admin: full ticket including patient fields.
    """
    ticket = get_object_or_404(
        QueueTicket.objects.select_related('clinic', 'department', 'patient'),
        pk=pk,
    )
    if _ticket_owner(request, ticket):
        return Response(QueueTicketSerializer(ticket).data)
    return Response(_public_ticket_payload(ticket))


@api_view(['GET'])
@permission_classes([AllowAny])
def ticket_position(request, pk):
    """Public position/ETA only — no patient PII."""
    ticket = get_object_or_404(
        QueueTicket.objects.select_related('clinic', 'department'),
        pk=pk,
    )
    return Response(_public_ticket_payload(ticket))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_ticket(request, pk):
    """Only the ticket owner (or admin) may cancel a waiting ticket."""
    ticket = get_object_or_404(QueueTicket, pk=pk)
    if not _ticket_owner(request, ticket):
        return Response({'detail': 'Not allowed to cancel this ticket.'}, status=status.HTTP_403_FORBIDDEN)
    if ticket.status != QueueTicket.Status.WAITING:
        return Response(
            {'detail': f'Cannot cancel a ticket with status {ticket.status}.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    ticket.mark_cancelled()
    return Response(QueueTicketSerializer(ticket).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsClinicStaff])
def clinic_queue(request):
    clinic, err = staff_clinic_or_403(request)
    if err:
        return err

    dept_id = request.query_params.get('department_id')
    statuses = request.query_params.get('status', 'WAITING,SERVING').split(',')
    qs = QueueTicket.objects.filter(clinic=clinic).select_related(
        'patient', 'department', 'clinic'
    )
    if dept_id:
        qs = qs.filter(department_id=dept_id)
    mapped = []
    for s in statuses:
        s = s.strip().upper()
        if s == 'CALLED':
            mapped.append(QueueTicket.Status.SERVING)
        else:
            mapped.append(s)
    qs = qs.filter(status__in=mapped)
    tickets = list(qs)
    waiting = [t for t in tickets if t.status == QueueTicket.Status.WAITING]
    others = [t for t in tickets if t.status != QueueTicket.Status.WAITING]
    waiting.sort(key=lambda t: (QueueTicket.PRIORITY_ORDER.get(t.priority, 99), t.created_at))
    return Response(QueueTicketSerializer(waiting + others, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsClinicStaff])
def clinic_overview(request):
    clinic, err = staff_clinic_or_403(request)
    if err:
        return err

    waiting = QueueTicket.objects.filter(clinic=clinic, status=QueueTicket.Status.WAITING)
    serving = QueueTicket.objects.filter(clinic=clinic, status=QueueTicket.Status.SERVING)
    completed = QueueTicket.objects.filter(clinic=clinic, status=QueueTicket.Status.COMPLETED)
    urgent = waiting.filter(
        priority__in=[QueueTicket.Priority.URGENT, QueueTicket.Priority.EMERGENCY]
    )

    return Response({
        'clinic_id': clinic.id,
        'clinic_name': clinic.name,
        'waiting': waiting.count(),
        'serving': serving.count(),
        'completed_today': completed.count(),
        'urgent_count': urgent.count(),
        'serving_tickets': QueueTicketSerializer(
            serving.select_related('patient', 'department'), many=True
        ).data,
        'note': 'Statistics reflect database records. Demo seed data is sample data.',
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsClinicStaff])
def call_next(request):
    clinic, err = staff_clinic_or_403(request)
    if err:
        return err

    department = None
    if request.data.get('department_id'):
        department = get_object_or_404(
            Department, pk=request.data['department_id'], clinic=clinic
        )

    ticket = call_next_patient(clinic, department)
    if ticket is None:
        return Response({'detail': 'No waiting patients in queue.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(QueueTicketSerializer(ticket).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsClinicStaff])
def complete_ticket(request, pk):
    clinic, err = staff_clinic_or_403(request)
    if err:
        return err
    ticket = get_object_or_404(QueueTicket, pk=pk)
    if ticket.clinic_id != clinic.id:
        return Response({'detail': 'Ticket does not belong to your clinic.'}, status=status.HTTP_403_FORBIDDEN)
    if ticket.status != QueueTicket.Status.SERVING:
        return Response(
            {'detail': 'Only a serving patient can be marked completed.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    ticket.mark_completed()
    return Response(QueueTicketSerializer(ticket).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsClinicStaff])
def no_show_ticket(request, pk):
    clinic, err = staff_clinic_or_403(request)
    if err:
        return err
    ticket = get_object_or_404(QueueTicket, pk=pk)
    if ticket.clinic_id != clinic.id:
        return Response({'detail': 'Ticket does not belong to your clinic.'}, status=status.HTTP_403_FORBIDDEN)
    if ticket.status not in (QueueTicket.Status.SERVING, QueueTicket.Status.WAITING):
        return Response({'detail': 'Invalid status for no-show.'}, status=status.HTTP_400_BAD_REQUEST)
    ticket.mark_no_show()
    return Response(QueueTicketSerializer(ticket).data)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsClinicStaff])
def update_priority(request, pk):
    clinic, err = staff_clinic_or_403(request)
    if err:
        return err
    ticket = get_object_or_404(QueueTicket, pk=pk)
    if ticket.clinic_id != clinic.id:
        return Response({'detail': 'Ticket does not belong to your clinic.'}, status=status.HTTP_403_FORBIDDEN)
    if ticket.status != QueueTicket.Status.WAITING:
        return Response(
            {'detail': 'Can only change priority for waiting tickets.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    ser = PriorityUpdateSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    ticket.priority = ser.validated_data['priority']
    ticket.save(update_fields=['priority'])
    return Response(QueueTicketSerializer(ticket).data)
