#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt

# Sync production static components
python manage.py collectstatic --no-input

# Mark migration 0001 as already handled so it skips the crash point
python manage.py migrate api 0001 --fake --no-input

# Run the rest of the updates smoothly
python manage.py makemigrations --no-input
python manage.py migrate --no-input
