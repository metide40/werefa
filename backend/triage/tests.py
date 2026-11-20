from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token

from clinics.models import Clinic, Department
from patients.models import Patient
from queues.models import QueueTicket
from queues.services import generate_ticket_number
from triage.models import TriageAssessment, EmergencyCase

User = get_user_model()


class TriageEmergencyTests(TestCase):
    def setUp(self):
        self.clinic = Clinic.objects.create(
            name='Test Clinic', city='Jimma', region='Oromia', clinic_type='Primary Hospital'
        )
        self.dept = Department.objects.create(
            clinic=self.clinic, name='OPD', code='OPD', room_number='1'
        )
        self.nurse = User.objects.create_user(
            username='nurse1', password='pass1234', role=User.Role.TRIAGE_NURSE, staff_clinic=self.clinic
        )
        self.patient_user = User.objects.create_user(
            username='pat1', password='pass1234', role=User.Role.PATIENT
        )
        self.staff = User.objects.create_user(
            username='staff1', password='pass1234', role=User.Role.CLINIC_STAFF, staff_clinic=self.clinic
        )
        Token.objects.create(user=self.nurse)
        Token.objects.create(user=self.patient_user)
        Token.objects.create(user=self.staff)
        self.client = APIClient()

    def _ticket(self, name='A Patient', priority='NORMAL'):
        p = Patient.objects.create(full_name=name)
        tn = generate_ticket_number(self.clinic, self.dept)
        return QueueTicket.objects.create(
            ticket_number=tn, patient=p, clinic=self.clinic, department=self.dept, priority=priority
        )

    def test_patient_cannot_submit_triage(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.get(user=self.patient_user).key}')
        r = self.client.post('/api/triage/assessments/', {
            'patient_name': 'X', 'presenting_complaint': 'pain', 'priority': 'EMERGENCY', 'confirm_priority': True,
        }, format='json')
        self.assertIn(r.status_code, (403, 401))

    def test_emergency_activation_and_priority_order(self):
        t1 = self._ticket('N1', 'NORMAL')
        t2 = self._ticket('N2', 'NORMAL')
        t3 = self._ticket('E1', 'NORMAL')
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.get(user=self.nurse).key}')
        r = self.client.post('/api/triage/assessments/', {
            'patient_id': t3.patient_id,
            'queue_ticket_id': t3.id,
            'department_id': self.dept.id,
            'presenting_complaint': 'Severe trauma',
            'priority': 'EMERGENCY',
            'confirm_priority': True,
        }, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        self.assertIsNotNone(r.data.get('emergency'))
        t3.refresh_from_db()
        self.assertEqual(t3.priority, 'EMERGENCY')
        # FIFO within priority: emergency first when calling ordering
        waiting = list(
            QueueTicket.objects.filter(clinic=self.clinic, status='WAITING').order_by(
                'priority', 'created_at'
            )
        )
        # priority ordering is lexicographic for strings; use PRIORITY_ORDER in service
        from queues.models import QueueTicket as QT
        ordered = sorted(
            QueueTicket.objects.filter(clinic=self.clinic, status='WAITING'),
            key=lambda x: (QT.PRIORITY_ORDER[x.priority], x.created_at),
        )
        self.assertEqual(ordered[0].id, t3.id)
        self.assertTrue(EmergencyCase.objects.filter(queue_ticket=t3).exists())
        # Original normal tickets preserved
        self.assertTrue(QueueTicket.objects.filter(id=t1.id).exists())
        self.assertTrue(QueueTicket.objects.filter(id=t2.id).exists())

    def test_confirm_priority_required(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.get(user=self.nurse).key}')
        r = self.client.post('/api/triage/assessments/', {
            'patient_name': 'Walk In',
            'department_id': self.dept.id,
            'presenting_complaint': 'headache',
            'priority': 'URGENT',
            'confirm_priority': False,
        }, format='json')
        self.assertEqual(r.status_code, 400)
