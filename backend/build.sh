#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt

# Sync production static components
python manage.py collectstatic --no-input

# 1. Fake the initial schema so Django thinks 0001 is fully applied
python manage.py migrate api --fake-initial --no-input

# 2. Make any remaining changes safely
python manage.py makemigrations --no-input
python manage.py migrate --no-input
