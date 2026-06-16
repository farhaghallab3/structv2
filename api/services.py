from .models import System, Table, Record, Template
from .template_data import TEMPLATE_DEFINITIONS, rows_to_record_data


def install_template_for_workspace(workspace, template_name):
    """Create a System with tables and records from a template."""
    if template_name not in TEMPLATE_DEFINITIONS:
        raise ValueError(f'Unknown template: {template_name}')

    if workspace.systems.filter(name=template_name).exists():
        raise ValueError(f'System "{template_name}" already exists in this workspace')

    template = Template.objects.filter(name=template_name).first()
    definition = TEMPLATE_DEFINITIONS[template_name]

    system = System.objects.create(
        workspace=workspace,
        name=template_name,
        template=template,
        description=definition['description'],
    )

    for table_def in definition['tables']:
        table = Table.objects.create(
            system=system,
            name=table_def['name'],
            columns=table_def['columns'],
        )
        records = rows_to_record_data(table_def['columns'], table_def.get('records', []))
        Record.objects.bulk_create([
            Record(table=table, data=record_data)
            for record_data in records
        ])

    return system


def install_default_systems(workspace):
    """Install the six default operating systems for a new workspace."""
    default_names = ['CRM', 'Cost Management', 'Cash Flow', 'Campaigns', 'Meetings', 'Product']
    systems = []
    for name in default_names:
        try:
            systems.append(install_template_for_workspace(workspace, name))
        except ValueError:
            continue
    return systems
