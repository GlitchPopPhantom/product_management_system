from django.contrib import admin
from .models import Product, Category

# Registering models without custom querysets or inline overrides 
# allows Django to initialize the admin interface without hitting the DB on load.
admin.site.register(Product)
admin.site.register(Category)
