from rest_framework import serializers
from .models import Product, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    # FIXED: Changed from category_id.name to category.name to pull from the model relation object safely
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Product
        fields = [
            'id', 
            'name', 
            'description', 
            'price', 
            'category_id',  # This links the foreign key integer value from your form
            'category_name', 
            'stock_quantity', 
            'image_url', 
            'created_at'
        ]
