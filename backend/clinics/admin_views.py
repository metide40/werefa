from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from accounts.permissions import IsPlatformAdmin
from clinics.models import Clinic
from queues.models import QueueTicket
from patients.models import Patient


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsPlatformAdmin])
def admin_overview(request):
    return Response({
        'partner_clinics': Clinic.objects.filter(is_active=True).count(),
        'total_patients': Patient.objects.count(),
        'waiting_tickets': QueueTicket.objects.filter(status=QueueTicket.Status.WAITING).count(),
        'serving_tickets': QueueTicket.objects.filter(status=QueueTicket.Status.SERVING).count(),
        'completed_tickets': QueueTicket.objects.filter(status=QueueTicket.Status.COMPLETED).count(),
        'note': 'Demo prototype statistics from local database only.',
    })
