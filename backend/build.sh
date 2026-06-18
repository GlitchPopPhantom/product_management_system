#!/usr/bin/env bash
set -o errexit

# 1. Install dependencies
pip install -r requirements.txt

# 2. Force Django to generate the correct blueprint layout 
python manage.py makemigrations api

# 3. Apply the layout directly to your database table
python manage.py migrate

# 4. Compile static assets safely
DATABASE_URL="postgres://dummy:dummy@localhost:5432/dummy" python manage.py collectstatic --no-input
