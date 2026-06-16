from django.contrib import admin
from .models import Workspace, Template, System, Table, Record, Notification


@admin.register(Workspace)
class WorkspaceAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'created_at')
    search_fields = ('name', 'owner__username')


@admin.register(Template)
class TemplateAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)


@admin.register(System)
class SystemAdmin(admin.ModelAdmin):
    list_display = ('name', 'workspace', 'template', 'created_at')
    list_filter = ('workspace',)
    search_fields = ('name',)


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ('name', 'system', 'record_count', 'created_at')
    list_filter = ('system',)


@admin.register(Record)
class RecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'table', 'created_at')
    list_filter = ('table',)


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'notification_type', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read')
