"""
Seed demonstration data for Werfa MVP presentation.
Usage: python manage.py seed_demo
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

from clinics.models import Clinic, Department
from patients.models import Patient
from queues.models import QueueTicket
from queues.services import generate_ticket_number

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed Werfa demo clinics, users, and sample queue tickets'

    def handle(self, *args, **options):
        self.stdout.write('Seeding Werfa demo data...')

        # --- Users ---
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@werfa.demo',
                'first_name': 'Werfa',
                'last_name': 'Admin',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            },
        )
        if not admin_user.has_usable_password():
            admin_user.set_password('werfa-admin-demo')
            admin_user.save()
        Token.objects.get_or_create(user=admin_user)

        # Clinics
        jush, _ = Clinic.objects.get_or_create(
            name='Jimma University Specialized Hospital (JUSH)',
            defaults={
                'name_am': 'የጅማ ዩኒቨርሲቲ ስፔሻላይዝድ ሆስፒታል',
                'name_om': 'Hospitaala Ispeeshaalaayizdii Yuunivarsiitii Jimmaa',
                'city': 'Jimma',
                'region': 'Oromia',
                'location': 'Hospital Road, Jimma Town',
                'phone': '+251 47 111 2026',
                'clinic_type': Clinic.ClinicType.REFERRAL,
                'is_partner': True,
                'subscription_status': 'partner',
                'active_doctors': 48,
                'description': 'Demo partner hospital — sample data only.',
            },
        )
        shenen, _ = Clinic.objects.get_or_create(
            name='Shenen Gibe Primary Hospital',
            defaults={
                'name_am': 'ሸነን ጊቤ የመጀመሪያ ደረጃ ሆስፒታል',
                'name_om': 'Hospitaala Sadarkaa Tokkoffaa Shanan Gibe',
                'city': 'Jimma',
                'region': 'Oromia',
                'location': 'Mendera Kochi, Jimma',
                'phone': '+251 47 111 8842',
                'clinic_type': Clinic.ClinicType.PRIMARY,
                'is_partner': True,
                'subscription_status': 'active',
                'active_doctors': 16,
                'description': 'Demo primary hospital — sample data only.',
            },
        )

        depts_jush = [
            ('OPD', 'Outpatient Department (OPD)', 'የተመላላሽ ታካሚዎች ክፍል', "Kutaa Dhukkubsattoota Deddeebi'anii (OPD)", 'Rooms 101-108', 15),
            ('EMG', 'Emergency & Triage', 'ድንገተኛ እና ቅድመ ምርመራ', 'Kutaa Balaa fi Triage', 'Trauma Wing A', 5),
            ('MCH', 'Maternal & Child Health (MCH)', 'የእናት እና ህፃናት ጤና', "Fayyaa Haadholii fi Daa'immanii (MCH)", 'Block C', 12),
            ('PED', 'Pediatrics Clinic', 'የህፃናት ህክምና ክፍል', "Kutaa Yaala Daa'immanii", 'Pediatric Center 2', 14),
        ]
        jush_depts = {}
        for code, name, am, om, room, avg in depts_jush:
            d, _ = Department.objects.get_or_create(
                clinic=jush, code=code,
                defaults={
                    'name': name, 'name_am': am, 'name_om': om,
                    'room_number': room, 'avg_wait_mins': avg, 'is_active': True,
                },
            )
            jush_depts[code] = d

        depts_sg = [
            ('GEN', 'General Consultation', 'ጠቅላላ ህክምና', 'Yaala Waliigalaa', 'Clinic 1 & 2', 12),
            ('EYE', 'Ophthalmology (Eye Clinic)', 'የዓይን ህክምና', 'Yaala Ijaa', 'Eye Center', 20),
        ]
        sg_depts = {}
        for code, name, am, om, room, avg in depts_sg:
            d, _ = Department.objects.get_or_create(
                clinic=shenen, code=code,
                defaults={
                    'name': name, 'name_am': am, 'name_om': om,
                    'room_number': room, 'avg_wait_mins': avg, 'is_active': True,
                },
            )
            sg_depts[code] = d

        # Staff
        staff, created = User.objects.get_or_create(
            username='clinic_staff',
            defaults={
                'email': 'staff@werfa.demo',
                'first_name': 'Dr. Demo',
                'last_name': 'Staff',
                'role': User.Role.CLINIC_STAFF,
                'staff_clinic': jush,
                'is_staff': True,
            },
        )
        if created or not staff.has_usable_password():
            staff.set_password('werfa-staff-demo')
            staff.staff_clinic = jush
            staff.role = User.Role.CLINIC_STAFF
            staff.save()
        Token.objects.get_or_create(user=staff)

        # Patient user
        patient_user, created = User.objects.get_or_create(
            username='patient',
            defaults={
                'email': 'patient@werfa.demo',
                'first_name': 'Tolosa',
                'last_name': 'Gemeda',
                'role': User.Role.PATIENT,
            },
        )
        if created or not patient_user.has_usable_password():
            patient_user.set_password('werfa-patient-demo')
            patient_user.save()
        Token.objects.get_or_create(user=patient_user)

        patient_profile, _ = Patient.objects.get_or_create(
            user=patient_user,
            defaults={
                'full_name': 'Tolosa Gemeda',
                'phone_number': '+251 91 234 5678',
                'preferred_language': 'om',
            },
        )

        # Sample patients & tickets (only if queue empty for clean re-seed of tickets)
        if QueueTicket.objects.count() == 0:
            sample_names = [
                ('Abebe Kebede', 'NORMAL'),
                ('Fatuma Hassan', 'URGENT'),
                ('Chala Bekele', 'NORMAL'),
                ('Sara Alemu', 'EMERGENCY'),
                ('Mohammed Yusuf', 'NORMAL'),
            ]
            opd = jush_depts['OPD']
            for name, priority in sample_names:
                p = Patient.objects.create(full_name=name, phone_number='+251 90 000 0000')
                tn = generate_ticket_number(jush, opd)
                QueueTicket.objects.create(
                    ticket_number=tn,
                    patient=p,
                    clinic=jush,
                    department=opd,
                    priority=priority,
                    status=QueueTicket.Status.WAITING,
                    notes='Demo sample ticket',
                )

        self.stdout.write(self.style.SUCCESS('Demo data ready.'))
        self.stdout.write('')
        self.stdout.write('=== DEMO CREDENTIALS (sample accounts only) ===')
        self.stdout.write('  Admin:        username=admin         password=werfa-admin-demo')
        self.stdout.write('  Clinic Staff: username=clinic_staff  password=werfa-staff-demo')
        self.stdout.write('  Patient:      username=patient       password=werfa-patient-demo')
        self.stdout.write('================================================')
