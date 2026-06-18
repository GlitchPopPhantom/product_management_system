import uuid
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator

class Category(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

class Product(models.Model):
    # Link every product to the specific user who manages it
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    
    # Validation: Price must be greater than 0
    price = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        validators=[MinValueValidator(0.01)]
    )
    
    # EXACT REQUIREMENT FIELD NAME: category_id
    category_id = models.ForeignKey(Category, on_delete=models.CASCADE, db_column='category_id', related_name='products')
    
    # EXACT REQUIREMENT FIELD NAMES
    stock_quantity = models.IntegerField(validators=[MinValueValidator(0)])
    image_url = models.URLField(max_length=500, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.user.username})"
