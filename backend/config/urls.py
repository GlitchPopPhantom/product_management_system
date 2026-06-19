from django.contrib import admin
from django.urls import path, include
from django.db import connection

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]

# Baseline structural table sync routine
def sync_baseline_tables():
    with connection.cursor() as cursor:
        # Create core application table with a dummy stock column
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS api_product (
                id BIGSERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                stock INTEGER DEFAULT 0  -- <--- Injected dummy column for migration 0002 to drop
            );
        """)
        
        # Create categories table baseline if missing
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS api_category (
                id BIGSERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL
            );
        """)

# Execute baseline sync immediately on server initiation
try:
    sync_baseline_tables()
except Exception:
    pass
