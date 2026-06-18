#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

# 1. Install project dependencies
pip install -r requirements.txt

# 2. Force Django to generate fresh migration files from your clean models
python manage.py makemigrations api

# 3. Apply the newly generated migrations to build your database tables
python manage.py migrate

# 4. Compile static assets safely now that schemas are fully configured
DATABASE_URL="postgres://dummy:dummy@localhost:5432/dummy" python manage.py collectstatic --no-input

# 5. Populate database with your 12 product categories
python manage.py shell -c "
from api.models import Category
categories = [
    'Electronics', 'Clothing', 'Groceries', 'Home Appliances', 
    'Books', 'Health & Beauty', 'Automotive', 'Toys & Games', 
    'Sports & Outdoors', 'Office Supplies', 'Furniture', 'Other'
]
for cat_name in categories:
    Category.objects.get_or_create(name=cat_name)
print('Successfully seeded database with 12 categories!')
"
