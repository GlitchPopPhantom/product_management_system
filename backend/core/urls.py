from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # This includes the URLs defined in your 'api' app
    path('api/', include('api.urls')), 
]
