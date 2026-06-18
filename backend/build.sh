#!/usr/bin/env bash
set -o errexit

# 1. Install project dependencies
pip install -r requirements.txt

# 2. FORCE Django to generate a brand new layout blueprint for your database
python manage.py makemigrations api

# 3. Force Django to push that new layout into the database
python manage.py migrate

# 4. Compile static assets safely
DATABASE_URL="postgres://dummy:dummy@localhost:5432/dummy" python manage.py collectstatic --no-input

# 5. Seed the database with the 12 required categories
python manage.py shell -c "
from api.models import Category
categories = [
    'Electronics', 'Clothing', 'Groceries', 'Home Appliances', 
    'Books', 'Health & Beauty', 'Automotive', 'Toys & Games', 
    'Sports & Outdoors', 'Office Supplies', 'Furniture', 'Other'
]
for cat_name in categories:
    Category.objects.get_or_create(name=cat_name)
print('Successfully populated database with 12 categories!')
"
