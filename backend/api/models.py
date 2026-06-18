from django.db import models
from django.contrib.auth.models import User

# ==========================================
# 1. CATEGORY MODEL
# ==========================================
class Category(models.Model):
    name = models.CharField(max_value=100, unique=True)

    def __str__(self):
        return self.name

# ==========================================
# 2. PRODUCT MODEL
# ==========================================
class Product(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_value=255)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock_quantity = models.IntegerField(default=0)
    image_url = models.URLField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # FIXED: Handled cleanly via standard ForeignKey relationship. 
    # Optional field allowing null ensures Django initializes safely without boot-time database queries.
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')

    def __str__(self):
        return self.name
