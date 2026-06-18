from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Standard Django admin route
    path('admin/', admin.site.urls),
    
    # Your API routes
    path('api/', include('api.urls')),
]
