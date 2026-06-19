#!/usr/bin/env bash
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Create the blueprint migration files
python manage.py makemigrations api

# Collect statics safely
DATABASE_URL="postgres://dummy:dummy@localhost:5432/dummy" python manage.py collectstatic --no-input
