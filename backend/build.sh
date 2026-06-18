#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

# 1. Install dependencies
pip install -r requirements.txt

# 2. Compile static assets safely with inline dummy URL
DATABASE_URL="postgres://dummy:dummy@localhost:5432/dummy" python manage.py collectstatic --no-input

# 3. FORCE TABLE CREATION WITHOUT MIGRATION FILES
python manage.py migrate --run-syncdb
