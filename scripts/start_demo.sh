#!/usr/bin/env bash
# Local examiner demo — one machine, LAN-accessible
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export DJANGO_DB_PATH="${DJANGO_DB_PATH:-/tmp/werfa_db.sqlite3}"
export DJANGO_ALLOW_ALL_HOSTS=1
export DJANGO_CORS_ALLOW_ALL=1
export DJANGO_DEBUG=1

echo "==> Backend migrate + seed"
cd "$ROOT/backend"
python3 -m pip install -q -r requirements.txt
python3 manage.py migrate --noinput
python3 manage.py seed_demo

echo "==> Frontend build (if needed)"
cd "$ROOT"
if [ ! -d dist ]; then
  npm install
  npm run build
fi

echo "==> Collect static"
cd "$ROOT/backend"
python3 manage.py collectstatic --noinput 2>/dev/null || true

HOST_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
echo ""
echo "=============================================="
echo "  Werfa DEMO"
echo "  Local:   http://127.0.0.1:8000"
echo "  Network: http://${HOST_IP:-YOUR_LAN_IP}:8000"
echo "=============================================="
echo "  Admin:        admin / werfa-admin-demo"
echo "  Clinic staff: clinic_staff / werfa-staff-demo"
echo "  Triage:       triage_nurse / werfa-triage-demo"
echo "=============================================="
echo ""
cd "$ROOT/backend"
python3 manage.py runserver 0.0.0.0:8000
