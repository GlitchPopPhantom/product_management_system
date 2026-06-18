from rest_framework import serializers
from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    # This explicitly overrides the model and forces it to be read-only
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Task
        fields = ['id', 'title', 'completed', 'user']
