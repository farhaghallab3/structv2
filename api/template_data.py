"""Default template definitions — stored in DB and used to install systems."""

TEMPLATE_DEFINITIONS = {
    'CRM': {
        'description': 'Track opportunities, companies, contacts, and activities.',
        'tables': [
            {
                'name': 'Opportunities',
                'columns': ['Opportunity', 'Company', 'Stage', 'Owner', 'Value', 'Next Action'],
                'records': [
                    ['Annual support package', 'Al Noor Group', 'Proposal', 'Ahmed', '85K', 'Send revised quote'],
                    ['CRM implementation', 'Smart Food', 'Discovery', 'Sara', '42K', 'Book demo'],
                    ['Operations dashboard', 'Riyadh Clinics', 'Negotiation', 'Omar', '120K', 'Follow legal review'],
                ],
            },
            {'name': 'Companies', 'columns': ['Company', 'Industry', 'Size', 'Owner', 'Status'], 'records': []},
            {'name': 'Contacts', 'columns': ['Name', 'Company', 'Role', 'Email', 'Phone'], 'records': []},
            {'name': 'Activities', 'columns': ['Activity', 'Contact', 'Type', 'Date', 'Owner'], 'records': []},
        ],
    },
    'Cost Management': {
        'description': 'Budgets, transactions, vendors, and approvals.',
        'tables': [
            {
                'name': 'Cost Summary',
                'columns': ['Category', 'Budget', 'Actual', 'Variance', 'Usage', 'Owner'],
                'records': [
                    ['Payroll', '25,000', '25,000', '0', '100%', 'Finance'],
                    ['Marketing', '10,000', '8,500', '-1,500', '85%', 'Growth'],
                    ['Software', '2,000', '2,300', '+300', '115%', 'Ops'],
                ],
            },
            {'name': 'Transactions', 'columns': ['Date', 'Category', 'Amount', 'Vendor', 'Status'], 'records': []},
            {'name': 'Budgets', 'columns': ['Category', 'Budget', 'Period', 'Owner'], 'records': []},
            {'name': 'Vendors', 'columns': ['Vendor', 'Category', 'Contact', 'Status'], 'records': []},
            {'name': 'Approvals', 'columns': ['Request', 'Amount', 'Requester', 'Status'], 'records': []},
        ],
    },
    'Cash Flow': {
        'description': 'Cash summary, inflows, outflows, and forecasts.',
        'tables': [
            {
                'name': 'Cash Summary',
                'columns': ['Period', 'Opening Cash', 'Inflows', 'Outflows', 'Closing Cash', 'Status'],
                'records': [
                    ['Week 1', '50,000', '35,000', '22,000', '63,000', 'Healthy'],
                    ['Week 2', '63,000', '18,000', '41,000', '40,000', 'Watch'],
                    ['Week 4', '57,000', '12,000', '64,000', '5,000', 'Critical'],
                ],
            },
            {'name': 'Inflows', 'columns': ['Source', 'Amount', 'Date', 'Status'], 'records': []},
            {'name': 'Outflows', 'columns': ['Category', 'Amount', 'Date', 'Status'], 'records': []},
            {'name': 'Forecast', 'columns': ['Period', 'Projected', 'Confidence'], 'records': []},
            {'name': 'Scenarios', 'columns': ['Scenario', 'Impact', 'Probability'], 'records': []},
        ],
    },
    'Campaigns': {
        'description': 'Campaigns, content, channels, creatives, and leads.',
        'tables': [
            {
                'name': 'Campaigns',
                'columns': ['Campaign', 'Channel', 'Status', 'Budget', 'Leads', 'Owner'],
                'records': [
                    ['Google Search Q3', 'Google', 'Active', '8,000', '32', 'Sara'],
                    ['Meta Awareness', 'Meta', 'Active', '5,000', '10', 'Maha'],
                    ['WhatsApp Follow-up', 'WhatsApp', 'Review', '1,500', '18', 'Ahmed'],
                ],
            },
            {'name': 'Content', 'columns': ['Title', 'Type', 'Status', 'Owner'], 'records': []},
            {'name': 'Channels', 'columns': ['Channel', 'Budget', 'Leads', 'Status'], 'records': []},
            {'name': 'Creatives', 'columns': ['Creative', 'Campaign', 'Format', 'Status'], 'records': []},
            {'name': 'Leads', 'columns': ['Lead', 'Source', 'Score', 'Owner'], 'records': []},
        ],
    },
    'Meetings': {
        'description': 'Meetings, agenda, decisions, actions, and attendees.',
        'tables': [
            {
                'name': 'Meetings',
                'columns': ['Meeting', 'Date', 'Owner', 'Status', 'Actions', 'Decision'],
                'records': [
                    ['Board Meeting', 'Jun 12', 'CEO', 'Scheduled', '4', 'Pending'],
                    ['Marketing Review', 'Jun 10', 'Sara', 'Done', '3', 'Approved'],
                    ['Product Sync', 'Jun 11', 'PM', 'Active', '5', 'Open'],
                ],
            },
            {'name': 'Agenda', 'columns': ['Topic', 'Meeting', 'Duration', 'Owner'], 'records': []},
            {'name': 'Decisions', 'columns': ['Decision', 'Meeting', 'Owner', 'Status'], 'records': []},
            {'name': 'Actions', 'columns': ['Action', 'Owner', 'Due', 'Status'], 'records': []},
            {'name': 'Attendees', 'columns': ['Name', 'Meeting', 'Role'], 'records': []},
        ],
    },
    'Product': {
        'description': 'Roadmap, features, bugs, releases, and feedback.',
        'tables': [
            {
                'name': 'Roadmap',
                'columns': ['Item', 'Type', 'Status', 'Owner', 'Priority', 'Release'],
                'records': [
                    ['AI Table Builder', 'Feature', 'Active', 'PM', 'High', 'v1'],
                    ['Record Drawer', 'Feature', 'Review', 'Design', 'High', 'v1'],
                    ['Permission bug', 'Bug', 'Open', 'Dev', 'Medium', 'v1'],
                ],
            },
            {'name': 'Features', 'columns': ['Feature', 'Status', 'Owner', 'Priority'], 'records': []},
            {'name': 'Bugs', 'columns': ['Bug', 'Severity', 'Owner', 'Status'], 'records': []},
            {'name': 'Releases', 'columns': ['Release', 'Date', 'Status'], 'records': []},
            {'name': 'Feedback', 'columns': ['Feedback', 'Source', 'Priority'], 'records': []},
        ],
    },
    'VSM': {
        'description': 'Value stream mapping for process optimization.',
        'tables': [
            {'name': 'Processes', 'columns': ['Process', 'Owner', 'Cycle Time', 'Status'], 'records': []},
            {'name': 'Steps', 'columns': ['Step', 'Process', 'Duration', 'Waste'], 'records': []},
        ],
    },
    'Content': {
        'description': 'Content planning, assets, and publishing.',
        'tables': [
            {'name': 'Content Plan', 'columns': ['Title', 'Type', 'Status', 'Owner', 'Due'], 'records': []},
            {'name': 'Assets', 'columns': ['Asset', 'Format', 'Status'], 'records': []},
        ],
    },
    'Business Analysis': {
        'description': 'Requirements, stakeholders, and analysis documents.',
        'tables': [
            {'name': 'Requirements', 'columns': ['Requirement', 'Priority', 'Status', 'Owner'], 'records': []},
            {'name': 'Stakeholders', 'columns': ['Name', 'Role', 'Influence'], 'records': []},
        ],
    },
}


def rows_to_record_data(columns, rows):
    """Convert row arrays to dict records keyed by column name."""
    return [{col: row[i] if i < len(row) else '' for i, col in enumerate(columns)} for row in rows]


def template_default_fields(template_name):
    """Build JSONField payload for a Template model."""
    definition = TEMPLATE_DEFINITIONS[template_name]
    tables = []
    for table in definition['tables']:
        tables.append({
            'name': table['name'],
            'columns': table['columns'],
            'records': rows_to_record_data(table['columns'], table.get('records', [])),
        })
    return {'tables': tables}
