"""
Struct Agent – Execution Agent
Works inside a single System context.
Supported actions: analyze, report, organize, improve, build, chat
"""

import json
from django.conf import settings
from .models import System, Table, Record, Workspace


def load_system_context(system_id, user):
    """Load full context of a system for the agent."""
    try:
        system = System.objects.prefetch_related('tables__records').get(
            id=system_id,
            workspace__owner=user
        )
    except System.DoesNotExist:
        return None

    tables_data = []
    for table in system.tables.all():
        records = list(table.records.values('id', 'data', 'created_at'))
        tables_data.append({
            'id': table.id,
            'name': table.name,
            'columns': table.columns,
            'record_count': len(records),
            'records': records[:50],  # limit to first 50 records for context
        })

    return {
        'system_id': system.id,
        'system_name': system.name,
        'system_description': system.description or '',
        'workspace_name': system.workspace.name,
        'tables': tables_data,
        'total_records': sum(t['record_count'] for t in tables_data),
    }


def _build_system_prompt(context, action_type, user_message):
    """Build the LLM system prompt based on context and action."""
    system_name = context['system_name']
    tables_summary = []
    for t in context['tables']:
        col_list = ', '.join(t['columns']) if t['columns'] else 'No columns'
        tables_summary.append(
            f"- Table '{t['name']}': {t['record_count']} records, Columns: [{col_list}]"
        )

    # Sample records for context (first table, first 5 rows)
    sample_data = ''
    if context['tables'] and context['tables'][0]['records']:
        rows = context['tables'][0]['records'][:5]
        sample_data = '\n'.join(
            json.dumps(r['data'], ensure_ascii=False) for r in rows
        )

    tables_str = '\n'.join(tables_summary) if tables_summary else 'No tables'

    action_instructions = {
        'analyze': (
            "Analyze the system data thoroughly. Identify:\n"
            "1. Missing or incomplete data\n"
            "2. Performance insights and trends\n"
            "3. Risks or delays\n"
            "4. Missing columns or KPIs\n"
            "5. Clear recommendations with priority\n"
            "Format your response with clear sections and bullet points."
        ),
        'report': (
            "Generate a professional report from the system data. Include:\n"
            "1. Executive Summary\n"
            "2. What happened / current status\n"
            "3. Key metrics and numbers\n"
            "4. Risks and issues\n"
            "5. Missing items\n"
            "6. Recommendations\n"
            "7. Next actions\n"
            "Be specific with numbers from the data."
        ),
        'organize': (
            "The user wants to organize or structure data.\n"
            "Help them understand how to structure their data into the system.\n"
            "If they provide raw text, suggest how to convert it into records with proper fields.\n"
            "Provide a clear, actionable response."
        ),
        'improve': (
            "Suggest improvements for this system. Consider:\n"
            "1. New columns that would add value\n"
            "2. KPI cards to add\n"
            "3. Views or filters to create\n"
            "4. Structural improvements\n"
            "5. Data quality improvements\n"
            "Be specific and prioritize by impact."
        ),
        'build': (
            "Help the user build or design a new system structure.\n"
            "Suggest: System name, Tables, Columns, KPIs, and initial setup.\n"
            "Be practical and start small."
        ),
        'chat': (
            "Answer the user's question about their system intelligently.\n"
            "Use the data context provided to give accurate, helpful answers."
        ),
    }

    instructions = action_instructions.get(action_type, action_instructions['chat'])

    return f"""You are Struct Agent – an intelligent execution agent built into Struct, an operating system for businesses.

You work ONLY within this system: "{system_name}"
You have access to the system's data and structure.

SYSTEM CONTEXT:
- System: {system_name}
- Workspace: {context['workspace_name']}
- Total Records: {context['total_records']}
- Tables:
{tables_str}

SAMPLE DATA (first 5 records from main table):
{sample_data if sample_data else 'No records yet'}

YOUR TASK – {action_type.upper()}:
{instructions}

IMPORTANT RULES:
- Detect the language of the user's message and ALWAYS respond in the SAME language (Arabic if Arabic, English if English)
- Be direct, structured, and actionable
- Reference actual data and numbers when available
- Do not make up data that doesn't exist
- Keep response focused and practical
- If suggesting changes, be specific about what exactly to add/change"""


def run_agent(system_id, user, message, action_type='chat'):
    """
    Main agent orchestrator.
    Returns a dict: { success, response, action_type, suggested_actions }
    """
    from openai import OpenAI

    api_key = getattr(settings, 'OPENAI_API_KEY', '')
    if not api_key:
        return {
            'success': False,
            'error': 'OpenAI API key not configured',
            'response': 'Agent is not configured yet. Please add OPENAI_API_KEY to the server.',
        }

    context = load_system_context(system_id, user)
    if not context:
        return {
            'success': False,
            'error': 'System not found',
            'response': 'System not found or access denied.',
        }

    system_prompt = _build_system_prompt(context, action_type, message)

    try:
        client = OpenAI(api_key=api_key)
        completion = client.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': message or f'Please {action_type} this system.'},
            ],
            max_tokens=1500,
            temperature=0.4,
        )
        response_text = completion.choices[0].message.content

        return {
            'success': True,
            'response': response_text,
            'action_type': action_type,
            'system_name': context['system_name'],
            'total_records': context['total_records'],
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'response': f'Agent error: {str(e)}',
        }
