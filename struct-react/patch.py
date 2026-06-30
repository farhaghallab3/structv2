import sys
import os

filepath = 'src/services/api.js'
content = open(filepath, 'r', encoding='utf-8').read()

old_code = """  runAgent(systemId, message, actionType = 'chat') {
    return request(`/systems/${systemId}/agent/`, {
      method: 'POST',
      body: JSON.stringify({ message, action_type: actionType }),
    });
  },"""

new_code = """  runAgent(systemId, message, actionType = 'chat', file = null) {
    const body = { message, action_type: actionType };
    if (file) {
      body.file_name = file.name;
      body.file_type = file.type;
      body.file_data = file.data;
    }
    return request(`/systems/${systemId}/agent/`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },"""

if old_code in content:
    content = content.replace(old_code, new_code)
    open(filepath, 'w', encoding='utf-8').write(content)
    print('Patched successfully!')
else:
    print('Target code not found. Here is a snippet of what is in the file near runAgent:')
    idx = content.find('runAgent')
    print(content[idx-100:idx+300])
