#!/usr/bin/env bash
set -o errexit

# 1. Install dependencies
pip install -r requirements.txt

# 2. Compile static assets safely
DATABASE_URL="postgres://dummy:dummy@localhost:5432/dummy" python manage.py collectstatic --no-input

# 3. Clear out our manual file and let Django generate the exact match for your models
rm -f api/migrations/0001_initial.py
python manage.py makemigrations api

# 4. Run the newly generated migration directly onto the live database
python manage.py migrate
