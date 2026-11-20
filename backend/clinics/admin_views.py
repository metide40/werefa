from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination

from accounts.permissions import IsPlatformAdmin
from accounts.models import User
from clinics.models import Clinic, Department
from clinics.serializers import ClinicListSerializer, ClinicCreateSerializer, ClinicSerializer
from patients.models import Patient
from queues.models import QueueTicket, ActivityEvent
from queues.serializers import QueueTicketSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPlatformAdmin])
def admin_overview(request):
    today = timezone.localdate()
    waiting = QueueTicket.objects.filter(status=QueueTicket.Status.WAITING).count()
    serving = QueueTicket.objects.filter(status=QueueTicket.Status.SERVING).count()
    completed = QueueTicket.objects.filter(
        status=QueueTicket.Status.COMPLETED,
        completed_at__date=today,
    ).count()
    no_show = QueueTicket.objects.filter(status=QueueTicket.Status.NO_SHOW).count()
    return Response({
        'partner_clinics': Clinic.objects.filter(is_active=True).count(),
        'total_clinics': Clinic.objects.count(),
        'total_departments': Department.objects.count(),
        'total_patients': Patient.objects.count(),
        'total_tickets': QueueTicket.objects.count(),
        'waiting_tickets': waiting,
        'serving_tickets': serving,
        'completed_today': completed,
        'no_show_tickets': no_show,
        'active_staff': User.objects.filter(role=User.Role.CLINIC_STAFF, is_active=True).count(),
        'note': 'Statistics from the application database.',
        'generated_at': timezone.now().isoformat(),
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsPlatformAdmin])
def admin_clinics(request):
    if request.method == 'GET':
        qs = Clinic.objects.all().prefetch_related('departments')
        status_filter = request.query_params.get('active')
        if status_filter == 'true':
            qs = qs.filter(is_active=True)
        elif status_filter == 'false':
            qs = qs.filter(is_active=False)
        search = request.query_params.get('q')
        if search:
            qs = qs.filter(
                Q(name__icontains=search) | Q(city__icontains=search) | Q(region__icontains=search)
            )
        return Response(ClinicListSerializer(qs, many=True).data)
    ser = ClinicCreateSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    clinic = ser.save()
    from queues.activity import log_activity
    log_activity(
        event_type=ActivityEvent.EventType.CLINIC_CREATE,
        message=f'Clinic registered: {clinic.name}',
        actor=request.user,
        clinic=clinic,
    )
    return Response(ClinicSerializer(clinic).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPlatformAdmin])
def admin_queues(request):
    """Platform-wide queue monitoring without patient PII."""
    qs = QueueTicket.objects.select_related('clinic', 'department').order_by('-created_at')
    if request.query_params.get('clinic_id'):
        qs = qs.filter(clinic_id=request.query_params['clinic_id'])
    if request.query_params.get('department_id'):
        qs = qs.filter(department_id=request.query_params['department_id'])
    if request.query_params.get('status'):
        statuses = [s.strip().upper() for s in request.query_params['status'].split(',')]
        mapped = []
        for s in statuses:
            if s == 'CALLED':
                mapped.append(QueueTicket.Status.SERVING)
            else:
                mapped.append(s)
        qs = qs.filter(status__in=mapped)
    if request.query_params.get('priority'):
        qs = qs.filter(priority=request.query_params['priority'].upper())

    paginator = PageNumberPagination()
    paginator.page_size = 50
    page = paginator.paginate_queryset(qs, request)
    results = []
    for t in page:
        status_val = 'CALLED' if t.status == QueueTicket.Status.SERVING else t.status
        results.append({
            'id': t.id,
            'ticketNumber': t.ticket_number,
            'clinicId': t.clinic_id,
            'clinicName': t.clinic.name,
            'departmentId': t.department_id,
            'departmentName': t.department.name,
            'priority': t.priority,
            'status': status_val,
            'joinedAt': t.created_at,
            'calledAt': t.called_at,
            'completedAt': t.completed_at,
        })
    return paginator.get_paginated_response(results)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPlatformAdmin])
def admin_activity(request):
    qs = ActivityEvent.objects.select_related('actor', 'clinic').order_by('-created_at')[:100]
    data = [
        {
            'id': e.id,
            'event_type': e.event_type,
            'message': e.message,
            'actor': e.actor.get_username() if e.actor_id else None,
            'clinic': e.clinic.name if e.clinic_id else None,
            'ticket_id': e.ticket_id,
            'created_at': e.created_at,
        }
        for e in qs
    ]
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPlatformAdmin])
def admin_health(request):
    from django.db import connection
    db_ok = False
    db_error = None
    try:
        connection.ensure_connection()
        with connection.cursor() as c:
            c.execute('SELECT 1')
        db_ok = True
    except Exception as e:
        db_error = str(e)[:200]
    status_label = 'healthy' if db_ok else 'unavailable'
    return Response({
        'status': status_label,
        'api': 'reachable',
        'database': 'connected' if db_ok else 'unavailable',
        'database_error': db_error,
        'environment': 'development' if __import__('django.conf', fromlist=['settings']).settings.DEBUG else 'production',
        'timestamp': timezone.now().isoformat(),
        'note': 'Health reflects API process and database connectivity only.',
    })


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated, IsPlatformAdmin])
def admin_clinic_detail(request, pk):
    try:
        clinic = Clinic.objects.prefetch_related('departments', 'staff_members').get(pk=pk)
    except Clinic.DoesNotExist:
        return Response({'detail': 'Clinic not found.'}, status=status.HTTP_404_NOT_FOUND)
    if request.method == 'GET':
        data = ClinicSerializer(clinic).data
        data['staff'] = [
            {
                'id': u.id,
                'username': u.username,
                'name': u.get_full_name() or u.username,
                'role': u.role,
                'is_active': u.is_active,
            }
            for u in clinic.staff_members.all()
        ]
        waiting = QueueTicket.objects.filter(clinic=clinic, status=QueueTicket.Status.WAITING).count()
        serving = QueueTicket.objects.filter(clinic=clinic, status=QueueTicket.Status.SERVING).count()
        data['queue_stats'] = {'waiting': waiting, 'serving': serving}
        return Response(data)
    # PATCH
    for field in ['name', 'city', 'region', 'location', 'phone', 'description', 'is_active', 'subscription_status']:
        if field in request.data:
            setattr(clinic, field, request.data[field])
    clinic.save()
    from queues.activity import log_activity
    log_activity(
        event_type=ActivityEvent.EventType.CLINIC_UPDATE,
        message=f'Clinic updated: {clinic.name}',
        actor=request.user,
        clinic=clinic,
    )
    return Response(ClinicSerializer(clinic).data)
