from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Workspace, System, Template, Table, Record, Notification


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'name')

    def get_name(self, obj):
        return obj.first_name or obj.username


class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
        fields = ('id', 'name', 'description', 'default_fields')


class RecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Record
        fields = ('id', 'data', 'created_at', 'updated_at')


class TableSerializer(serializers.ModelSerializer):
    records = RecordSerializer(many=True, read_only=True)
    record_count = serializers.SerializerMethodField()

    class Meta:
        model = Table
        fields = ('id', 'name', 'columns', 'record_count', 'records', 'created_at', 'updated_at')

    def get_record_count(self, obj):
        return obj.record_count


class SystemSerializer(serializers.ModelSerializer):
    tables = TableSerializer(many=True, read_only=True)
    template = TemplateSerializer(read_only=True)
    record_count = serializers.SerializerMethodField()

    class Meta:
        model = System
        fields = ('id', 'name', 'description', 'template', 'tables', 'record_count', 'created_at', 'updated_at')

    def get_record_count(self, obj):
        return obj.record_count


class WorkspaceSerializer(serializers.ModelSerializer):
    systems = SystemSerializer(many=True, read_only=True)
    owner = UserSerializer(read_only=True)

    class Meta:
        model = Workspace
        fields = ('id', 'name', 'owner', 'systems', 'created_at', 'updated_at')


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ('id', 'notification_type', 'title', 'message', 'is_read', 'created_at')
