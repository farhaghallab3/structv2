from django.db import models
from django.contrib.auth.models import User

class Workspace(models.Model):
    """Organization workspace"""
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='workspaces')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Template(models.Model):
    """System templates"""
    TEMPLATE_CHOICES = [
        ('CRM', 'CRM'),
        ('Cost Management', 'Cost Management'),
        ('Cash Flow', 'Cash Flow'),
        ('Campaigns', 'Campaigns'),
        ('Meetings', 'Meetings'),
        ('Product', 'Product'),
        ('VSM', 'VSM'),
        ('Content', 'Content'),
        ('Business Analysis', 'Business Analysis'),
    ]
    
    name = models.CharField(max_length=100, choices=TEMPLATE_CHOICES)
    description = models.TextField()
    default_fields = models.JSONField(default=dict)
    
    def __str__(self):
        return self.name


class System(models.Model):
    """Operating system (smart table container)"""
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='systems')
    name = models.CharField(max_length=255)
    template = models.ForeignKey(Template, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    @property
    def record_count(self):
        """Get count of records in all tables of this system"""
        return Record.objects.filter(table__system=self).count()


class Table(models.Model):
    """Data table within a system"""
    system = models.ForeignKey(System, on_delete=models.CASCADE, related_name='tables')
    name = models.CharField(max_length=255)
    columns = models.JSONField(default=list)  # List of column definitions
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.system.name} - {self.name}"

    @property
    def record_count(self):
        """Get count of records in this table"""
        return self.records.count()


class Record(models.Model):
    """Individual data record within a table"""
    table = models.ForeignKey(Table, on_delete=models.CASCADE, related_name='records')
    data = models.JSONField(default=dict)  # Store record data as JSON
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Record in {self.table.name}"


class Notification(models.Model):
    """User notifications"""
    NOTIFICATION_TYPES = [
        ('inbox', 'Inbox'),
        ('alert', 'Alert'),
        ('mention', 'Mention'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.user.username}"
