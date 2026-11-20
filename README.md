# Werfa (ወረፋ)

**Skip the wait, not the care.**

Werfa is a multilingual clinic queue-management prototype designed for healthcare facilities in Ethiopia. It aims to help patients join a clinic queue and follow their turn, while helping clinic staff organize patient flow.

The interface is being developed in **English, Amharic (አማርኛ), and Afaan Oromoo**.

## Current project status

This repository currently contains a **frontend prototype with demo data**. It is not yet connected to a production backend, clinic database, SMS provider, or real speech-recognition service.

Current frontend elements include:
- A landing page introducing Werfa.
- Patient queue-registration screens.
- Demo clinic and queue-ticket data.
- A language setup using `i18next` with English, Amharic, and Afaan Oromoo translation files.
- Browser `localStorage` persistence for prototype data.
- Placeholder clinic and admin dashboard routes.
- A pitch-demo route.

Features such as real clinic synchronization, reliable offline queue registration, live multi-device queue updates, voice recognition, SMS delivery, authentication, and production analytics still need implementation and testing.

## Tech stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- i18next / react-i18next
- Recharts
- Lucide React

## Getting started

### Requirements

- Node.js (use a current supported LTS release)
- npm

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal.

### Build for production

```bash
npm run build
```

### Run lint checks

```bash
npm run lint
```

## Project structure

```text
src/
├── components/    # Shared interface components
├── context/       # Application state and demo actions
├── data/          # Demo clinic and queue data
├── i18n/          # English, Amharic, and Afaan Oromoo translations
├── pages/         # Landing, patient, clinic, admin, and pitch screens
├── types/         # TypeScript domain types
├── App.tsx        # Application routes and providers
└── main.tsx       # Application entry point
public/            # Static assets and web app manifest
```

## Important product principles

- Clinical urgency must be determined by qualified clinic staff, not by payment.
- A paid feature must never allow a patient to bypass medically urgent patients.
- An offline ticket is not a confirmed place in the clinic's shared queue until it has safely synchronized with the clinic's authoritative system.
- Patient data must be protected and only the minimum necessary information should be collected.

## Contributing / development

Werfa is under active development. Changes should be tested locally before being treated as working product features. Please distinguish prototype behavior from real integrations in documentation and demos.

## Remaining MVP features (updated)

### Emergency alerts (clinic)
- Red highlight for EMERGENCY tickets on Live Queue
- Gentle Web Audio alert on new REPORTED emergency (once per case id)
- Mute/unmute persisted in `localStorage` (`werfa_mute_emergency`)
- Acknowledge action on alert panel

### ETA & patient notices
- ETA includes emergency interruption buffer when active (`EMERGENCY_ETA_BUFFER_MINUTES`, default 20)
- Public ticket position payload includes `queueInterrupted` + safe message (no third-party clinical details)
- Patient ticket view shows estimate disclaimer and emergency delay notice
- Patient client polls `/api/queues/tickets/{id}/position/`

### Offline triage
- IndexedDB store: `src/lib/offlineTriage.ts`
- Pending assessments use `client_request_id` idempotency keys
- Clear offline vs server-confirmed messaging; never claims remote patient notification while offline

### Admin emergency analytics
- `/api/admin/emergencies/` returns totals, by clinic, by department, priority audit, review indicators
- Admin UI filters by status

### Demo credentials
```
admin / werfa-admin-demo
clinic_staff / werfa-staff-demo
clinic_staff_shenen / werfa-staff-shenen
triage_nurse / werfa-triage-demo
patient / werfa-patient-demo
```

### Start
```bash
cd backend
export DJANGO_DB_PATH=/tmp/werfa_db.sqlite3
python manage.py migrate
python manage.py seed_demo
python manage.py runserver 0.0.0.0:8000

# frontend
npm install && npm run dev
```

## Notifications scope (pitch-ready honesty)

**Implemented now**
- In-app patient ticket updates via polling public position endpoint
- Emergency delay notice on patient ticket (no third-party clinical details)
- Clinic emergency visual + optional gentle audio alert with mute

**Not implemented (future enhancements)**
- SMS delivery to patient phones
- Mobile push notifications (FCM/APNs)
- Paid third-party messaging providers

Do not claim SMS or push delivery in the pitch. Describe them as planned integrations after incubation.
