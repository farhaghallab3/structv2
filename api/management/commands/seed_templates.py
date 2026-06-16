from django.core.management.base import BaseCommand
from api.models import Template
from api.template_data import TEMPLATE_DEFINITIONS, template_default_fields


class Command(BaseCommand):
    help = 'Seed system templates into the database'

    def handle(self, *args, **options):
        created = 0
        updated = 0

        for name, definition in TEMPLATE_DEFINITIONS.items():
            defaults = {
                'description': definition['description'],
                'default_fields': template_default_fields(name),
            }
            _, was_created = Template.objects.update_or_create(name=name, defaults=defaults)
            if was_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(self.style.SUCCESS(
            f'Templates seeded: {created} created, {updated} updated ({len(TEMPLATE_DEFINITIONS)} total).'
        ))
