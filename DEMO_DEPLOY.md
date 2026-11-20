# Werfa — Deploy for examiner demo

## Fastest option (same day): laptop + LAN

On the presentation laptop:

```bash
cd werefa
chmod +x scripts/start_demo.sh
./scripts/start_demo.sh
```

Then open on the examiner’s device (same Wi‑Fi):

`http://YOUR_LAPTOP_IP:8000`

Find your IP: Windows `ipconfig` · Mac/Linux `ifconfig` or `hostname -I`.

### Demo accounts
| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `werfa-admin-demo` |
| Clinic (JUSH) | `clinic_staff` | `werfa-staff-demo` |
| Clinic (Shenen) | `clinic_staff_shenen` | `werfa-staff-shenen` |
| Triage | `triage_nurse` | `werfa-triage-demo` |
| Patient | use Patient app (no staff login) | — |

---

## Public URL (internet) without campus firewall issues

### A) Local servers + free tunnel (recommended if cloud signup is slow)

Terminal 1 — backend + built frontend:

```bash
./scripts/start_demo.sh
```

Terminal 2 — tunnel (pick one):

```bash
# Cloudflare (no account needed for quick tunnel)
npx -y cloudflared tunnel --url http://127.0.0.1:8000

# or ngrok
ngrok http 8000
```

Share the HTTPS URL with examiners.

### B) Render.com free web service

1. Push this repo to GitHub.
2. [Render](https://render.com) → New → Web Service → connect repo.
3. Root directory: `backend`
4. Build command:
   ```bash
   pip install -r requirements.txt && cd .. && npm install && npm run build && cd backend && python manage.py migrate --noinput && python manage.py seed_demo && python manage.py collectstatic --noinput
   ```
5. Start: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
6. Env vars:
   - `DJANGO_ALLOW_ALL_HOSTS=1`
   - `DJANGO_CORS_ALLOW_ALL=1`
   - `DJANGO_DEBUG=0`
   - `DJANGO_DB_PATH=/tmp/werfa_db.sqlite3`
   - `DJANGO_SECRET_KEY=` (random string)

Note: Free tier may sleep after idle; wake it 2–3 minutes before the pitch. SQLite on free hosts is for **demo only**.

---

## Script for examiners (3 minutes)

1. Open the shared URL → Patient → join queue at JUSH.  
2. Sign in as **triage_nurse** → assess as Emergency.  
3. Sign in as **clinic_staff** → see alert + priority order.  
4. Complete consultation → patient status updates.  
5. Sign in as **admin** → Emergencies monitoring.

---

## Do not claim in the pitch

- Real SMS / push delivery  
- Production multi-server database HA  
- Paid cloud messaging  

Say: *“This is a working MVP on a shared demo environment; SMS and production hosting are next steps.”*
