from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token

from clinics.models import Clinic, Department
from patients.models import Patient
from queues.models import QueueTicket
from queues.services import ordered_waiting, call_next_patient

User = get_user_model()


class WerfaQueueAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.clinic = Clinic.objects.create(
            name='Test Clinic',
            city='Jimma',
            region='Oromia',
            clinic_type=Clinic.ClinicType.PRIMARY,
        )
        self.other_clinic = Clinic.objects.create(
            name='Other Clinic',
            city='Addis',
            region='Addis Ababa',
            clinic_type=Clinic.ClinicType.PRIMARY,
        )
        self.dept = Department.objects.create(
            clinic=self.clinic, name='OPD', code='OPD', avg_wait_mins=10
        )
        self.other_dept = Department.objects.create(
            clinic=self.other_clinic, name='OPD', code='OPD', avg_wait_mins=10
        )

        self.admin = User.objects.create_user(
            username='admin_test', password='pass1234', role=User.Role.ADMIN, is_staff=True
        )
        self.staff = User.objects.create_user(
            username='staff_test',
            password='pass1234',
            role=User.Role.CLINIC_STAFF,
            staff_clinic=self.clinic,
        )
        self.other_staff = User.objects.create_user(
            username='other_staff',
            password='pass1234',
            role=User.Role.CLINIC_STAFF,
            staff_clinic=self.other_clinic,
        )
        self.patient_user = User.objects.create_user(
            username='patient_test', password='pass1234', role=User.Role.PATIENT
        )
        self.patient = Patient.objects.create(
            user=self.patient_user,
            full_name='Test Patient',
            phone_number='+251900000001',
        )
        self.other_patient = Patient.objects.create(
            full_name='Other Patient',
            phone_number='+251900000002',
        )

        Token.objects.get_or_create(user=self.admin)
        Token.objects.get_or_create(user=self.staff)
        Token.objects.get_or_create(user=self.other_staff)
        Token.objects.get_or_create(user=self.patient_user)

    def auth(self, user):
        token = Token.objects.get(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def test_register_and_login(self):
        res = self.client.post(
            '/api/auth/register/',
            {
                'username': 'new_patient',
                'password': 'pass1234',
                'full_name': 'New Patient',
                'phone_number': '+251911111111',
            },
            format='json',
        )
        self.assertEqual(res.status_code, 201)
        self.assertIn('token', res.data)

        res = self.client.post(
            '/api/auth/login/',
            {'username': 'new_patient', 'password': 'pass1234'},
            format='json',
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn('token', res.data)

    def test_join_queue(self):
        res = self.client.post(
            '/api/queues/join/',
            {
                'clinic_id': self.clinic.id,
                'department_id': self.dept.id,
                'full_name': 'Walk-in Patient',
                'phone_number': '+251922222222',
            },
            format='json',
        )
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['status'], 'WAITING')
        self.assertTrue(res.data['ticketNumber'])

    def test_duplicate_ticket_prevention(self):
        self.auth(self.patient_user)
        payload = {
            'clinic_id': self.clinic.id,
            'department_id': self.dept.id,
            'full_name': 'Test Patient',
            'phone_number': '+251900000001',
        }
        res1 = self.client.post('/api/queues/join/', payload, format='json')
        self.assertEqual(res1.status_code, 201)
        res2 = self.client.post('/api/queues/join/', payload, format='json')
        self.assertEqual(res2.status_code, 400)
        self.assertIn('already', res2.data['detail'].lower())

    def test_priority_and_fifo_ordering(self):
        p1 = Patient.objects.create(full_name='Normal First')
        p2 = Patient.objects.create(full_name='Emergency')
        p3 = Patient.objects.create(full_name='Urgent')
        p4 = Patient.objects.create(full_name='Normal Second')
        t1 = QueueTicket.objects.create(
            ticket_number='T-001', patient=p1, clinic=self.clinic,
            department=self.dept, priority='NORMAL',
        )
        t2 = QueueTicket.objects.create(
            ticket_number='T-002', patient=p2, clinic=self.clinic,
            department=self.dept, priority='EMERGENCY',
        )
        t3 = QueueTicket.objects.create(
            ticket_number='T-003', patient=p3, clinic=self.clinic,
            department=self.dept, priority='URGENT',
        )
        t4 = QueueTicket.objects.create(
            ticket_number='T-004', patient=p4, clinic=self.clinic,
            department=self.dept, priority='NORMAL',
        )
        ordered = ordered_waiting(clinic=self.clinic, department=self.dept)
        self.assertEqual(
            [t.ticket_number for t in ordered],
            ['T-002', 'T-003', 'T-001', 'T-004'],
        )

    def test_call_next_and_complete(self):
        p = Patient.objects.create(full_name='Caller')
        QueueTicket.objects.create(
            ticket_number='T-C1', patient=p, clinic=self.clinic,
            department=self.dept, priority='NORMAL',
        )
        self.auth(self.staff)
        res = self.client.post('/api/queues/clinic/call-next/', {}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['status'], 'CALLED')
        ticket_id = res.data['id']

        res = self.client.post(f'/api/queues/clinic/{ticket_id}/complete/', {}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['status'], 'COMPLETED')

    def test_public_ticket_hides_pii(self):
        p = Patient.objects.create(full_name='Secret Name', phone_number='+251933333333')
        t = QueueTicket.objects.create(
            ticket_number='T-PII', patient=p, clinic=self.clinic, department=self.dept,
        )
        # Anonymous
        res = self.client.get(f'/api/queues/tickets/{t.id}/')
        self.assertEqual(res.status_code, 200)
        self.assertNotIn('Secret Name', str(res.data))
        self.assertNotIn('+251933333333', str(res.data))
        self.assertIn('ticketNumber', res.data)

        # Owner sees full
        self.auth(self.patient_user)
        # Attach patient user to ticket
        t.patient = self.patient
        t.save()
        res = self.client.get(f'/api/queues/tickets/{t.id}/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data.get('patientName'), 'Test Patient')

    def test_cancel_requires_owner(self):
        t = QueueTicket.objects.create(
            ticket_number='T-CAN', patient=self.patient, clinic=self.clinic, department=self.dept,
        )
        # Other authenticated patient cannot cancel
        stranger = User.objects.create_user(username='stranger', password='pass1234', role=User.Role.PATIENT)
        Patient.objects.create(user=stranger, full_name='Stranger')
        Token.objects.get_or_create(user=stranger)
        self.auth(stranger)
        res = self.client.post(f'/api/queues/tickets/{t.id}/cancel/', {}, format='json')
        self.assertEqual(res.status_code, 403)

        # Owner can cancel
        self.auth(self.patient_user)
        res = self.client.post(f'/api/queues/tickets/{t.id}/cancel/', {}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['status'], 'CANCELLED')

    def test_staff_cannot_access_other_clinic(self):
        p = Patient.objects.create(full_name='Other Clinic Patient')
        t = QueueTicket.objects.create(
            ticket_number='T-OC', patient=p, clinic=self.other_clinic, department=self.other_dept,
        )
        self.auth(self.staff)  # assigned to self.clinic only
        res = self.client.post(f'/api/queues/clinic/{t.id}/complete/', {}, format='json')
        # Ticket not SERVING and/or wrong clinic — must not succeed for other clinic
        self.assertIn(res.status_code, (400, 403))

        # Queue list should only include own clinic tickets
        QueueTicket.objects.create(
            ticket_number='T-OWN', patient=Patient.objects.create(full_name='Own'),
            clinic=self.clinic, department=self.dept,
        )
        res = self.client.get('/api/queues/clinic/')
        self.assertEqual(res.status_code, 200)
        clinic_ids = {item['clinicId'] for item in res.data}
        self.assertEqual(clinic_ids, {self.clinic.id})
