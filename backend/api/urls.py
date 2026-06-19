from django.urls import path
from rest_framework.authtoken.views import obtain_auth_token
from .views import (
    register_user, 
    dashboard_stats, 
    ProductListCreate, 
    ProductDetail, 
    CategoryListCreate
)

urlpatterns = [
    # Auth Endpoints
    path('login/', obtain_auth_token, name='api_login'),
    path('register/', register_user, name='api_register'),
    
    # Dashboard Stats Endpoint
    path('dashboard-stats/', dashboard_stats, name='dashboard-stats'),
    
    # Product & Category Endpoints (What your frontend is actually looking for)
    path('products/', ProductListCreate.as_view(), name='product-list-create'),
    path('products/<int:pk>/', ProductDetail.as_view(), name='product-detail'),
    path('categories/', CategoryListCreate.as_view(), name='category-list-create'),
]
