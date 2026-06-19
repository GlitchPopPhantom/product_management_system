#!/usr/bin/env bash
set -o errexit

# 1. Install all dependencies
pip install -r requirements.txt

# 2. Compile static assets safely without hitting the database link yet
DATABASE_URL="postgres://dummy:dummy@localhost:5432/dummy" python manage.py collectstatic --no-input

# 3. Create migration files
python manage.py makemigrations api

# 4. Force migrations directly onto your live database during the build
python manage.py migrate
