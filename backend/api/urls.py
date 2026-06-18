from django.urls import path
from .views import register_user, ProductListCreate, ProductDetail, CategoryListCreate, dashboard_stats

urlpatterns = [
    path('login/', register_user, name='api_login'),
    path('register/', register_user, name='api_register'),
    path('products/', ProductListCreate.as_view(), name='product-list-create'),
    path('products/<int:pk>/', ProductDetail.as_view(), name='product-detail'),
    path('categories/', CategoryListCreate.as_view(), name='category-list-create'),
    path('dashboard-stats/', dashboard_stats, name='dashboard-stats'),
]
