# Werfa Backend (Django MVP)

Database-backed queue management API for the Werfa React frontend.

## Stack

- Django 5/6 + Django REST Framework
- Token authentication
- SQLite (demo)
- django-cors-headers

## Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 0.0.0.0:8000
```

API base: `http://127.0.0.1:8000/api`

## Demo credentials (sample accounts only)

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `werfa-admin-demo` |
| Clinic Staff | `clinic_staff` | `werfa-staff-demo` |
| Patient | `patient` | `werfa-patient-demo` |

## Core endpoints

### Auth
- `POST /api/auth/register/` — `{ username, password, full_name, phone_number? }`
- `POST /api/auth/login/` — `{ username, password }` → `{ token, user }`
- `POST /api/auth/logout/`
- `GET /api/auth/me/`

### Clinics
- `GET /api/clinics/`
- `GET /api/clinics/{id}/`
- `GET /api/clinics/{id}/departments/`

### Patient queue
- `POST /api/queues/join/` — `{ clinic_id, department_id, full_name, phone_number?, notes? }`
- `GET /api/queues/my-tickets/`
- `GET /api/queues/tickets/{id}/`
- `GET /api/queues/tickets/{id}/position/`
- `POST /api/queues/tickets/{id}/cancel/`

### Clinic staff (Token auth)
- `GET /api/queues/clinic/`
- `GET /api/queues/clinic/overview/`
- `POST /api/queues/clinic/call-next/`
- `POST /api/queues/clinic/{id}/complete/`
- `POST /api/queues/clinic/{id}/no-show/`
- `PATCH /api/queues/clinic/{id}/priority/` — `{ priority: EMERGENCY|URGENT|NORMAL }`

### Admin
- `GET /api/admin/overview/`
- `GET /api/admin/clinics/`
- `POST /api/admin/clinics/`

## Queue rules

1. EMERGENCY → URGENT → NORMAL
2. FIFO within each priority
3. ETA = people ahead × average consultation minutes (estimate only)
4. Priority changes require clinic staff

## Frontend

From project root:

```bash
# optional: echo "VITE_API_BASE_URL=http://127.0.0.1:8000/api" > .env
npm install
npm run dev
```

The React app loads clinics from the API, joins queues via the API, and clinic dashboard actions call the API (with local fallback if the server is offline).

## Admin endpoints (ADMIN role)

- `GET /api/admin/overview/` — real DB counts
- `GET /api/admin/clinics/` — list/search clinics
- `POST /api/admin/clinics/` — register clinic
- `GET /api/admin/queues/` — platform queues (no patient PII)
- `GET /api/admin/activity/` — activity feed from ActivityEvent

## Clinic dashboard auth

Staff must have `role=CLINIC_STAFF` and `staff_clinic` set.
Dashboard uses `GET /api/auth/me/` for assigned clinic (not `clinics[0]`).
Set `VITE_DEMO_AUTO_LOGIN=true` only for local demos.
