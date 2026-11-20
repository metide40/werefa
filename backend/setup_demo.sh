#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export DJANGO_DB_PATH="${DJANGO_DB_PATH:-/tmp/werfa_db.sqlite3}"
echo "Using database: $DJANGO_DB_PATH"
python3 -m pip install -q -r requirements.txt
python3 manage.py migrate
python3 manage.py seed_demo
echo ""
echo "Start the API with:"
echo "  export DJANGO_DB_PATH=$DJANGO_DB_PATH"
echo "  python3 manage.py runserver 0.0.0.0:8000"
