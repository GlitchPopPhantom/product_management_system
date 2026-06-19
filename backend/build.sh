#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
DATABASE_URL="postgres://dummy:dummy@localhost:5432/dummy" python manage.py collectstatic --no-input
