#!/usr/bin/env bash
set -o errexit

# 1. Install project dependencies
pip install -r requirements.txt

# 2. Compile static assets safely with dummy URL
DATABASE_URL="postgres://dummy:dummy@localhost:5432/dummy" python manage.py collectstatic --no-input

# 3. Create tables directly from models
python manage.py migrate --run-syncdb

# 4. Populate database with your 12 product categories
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
