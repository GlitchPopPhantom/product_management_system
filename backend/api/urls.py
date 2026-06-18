from django.urls import path
from .views import register_user, TaskListCreate
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('login/', obtain_auth_token, name='api_login'),
    path('register/', register_user, name='api_register'),
    path('tasks/', TaskListCreate.as_view(), name='task-list-create'),
]
