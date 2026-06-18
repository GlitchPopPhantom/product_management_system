from rest_framework import serializers
from .models import Product, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category_id.name')

    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'price', 'category_id', 'category_name', 'stock_quantity', 'image_url', 'created_at']
