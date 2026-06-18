#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

# 1. Install dependencies
pip install -r requirements.txt

# 2. Force Django to build the database tables directly from the models
python manage.py migrate --run-syncdb

# 3. Compile static assets safely with a dummy database fallback URL
DATABASE_URL="postgres://dummy:dummy@localhost:5432/dummy" python manage.py collectstatic --no-input

# 4. Seed the database with the 12 required categories
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
