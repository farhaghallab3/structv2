from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Record, System, Notification


@receiver(post_save, sender=Record)
def notify_on_record_create(sender, instance, created, **kwargs):
    """Create a notification when a new record is added to a system."""
    if not created:
        return
    try:
        system = instance.table.system
        workspace = system.workspace
        owner = workspace.owner
        Notification.objects.create(
            user=owner,
            notification_type='inbox',
            title=f'New record in {system.name}',
            message=f'A new record was added to "{system.name}" in your workspace.',
        )
    except Exception:
        pass  # Never break the main action if notification fails


@receiver(post_save, sender=System)
def notify_on_system_create(sender, instance, created, **kwargs):
    """Create a notification when a new system is created."""
    if not created:
        return
    try:
        owner = instance.workspace.owner
        Notification.objects.create(
            user=owner,
            notification_type='inbox',
            title=f'System "{instance.name}" created',
            message=f'Your new operating system "{instance.name}" is ready to use.',
        )
    except Exception:
        pass
