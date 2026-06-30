const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

function getToken() {
  return localStorage.getItem('struct_token');
}

function setAuth(token, user, workspace) {
  localStorage.setItem('struct_token', token);
  localStorage.setItem('struct_user', JSON.stringify(user));
  if (workspace) {
    localStorage.setItem('struct_workspace', JSON.stringify(workspace));
  }
}

function clearAuth() {
  localStorage.removeItem('struct_token');
  localStorage.removeItem('struct_user');
  localStorage.removeItem('struct_workspace');
}

function getStoredUser() {
  const raw = localStorage.getItem('struct_user');
  return raw ? JSON.parse(raw) : null;
}

function getStoredToken() {
  return getToken();
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Token ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.detail || 'Request failed');
  }

  return data;
}

export const api = {
  getStoredUser,
  getStoredToken,
  setAuth,
  clearAuth,

  signup(name, email, password) {
    return request('/auth/signup/', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  login(email, password) {
    return request('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  getDashboard() {
    return request('/dashboard/');
  },

  installTemplate(workspaceId, templateName) {
    return request(`/workspaces/${workspaceId}/install-template/`, {
      method: 'POST',
      body: JSON.stringify({ template_name: templateName }),
    });
  },
  createSystem(workspaceId, name) {
  return request(`/workspaces/${workspaceId}/systems/`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
},

  createRecord(tableId, data) {
    return request(`/tables/${tableId}/records/`, {
      method: 'POST',
      body: JSON.stringify({ data }),
    });
  },

  updateRecord(tableId, recordId, data) {
    return request(`/tables/${tableId}/records/${recordId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ data }),
    });
  },
  inviteMember(workspaceId, email, role, systemName = '', systemId = null) {
    return request(`/workspaces/${workspaceId}/invite/`, { method: 'POST', body: JSON.stringify({ email, role, system_name: systemName, system_id: systemId }) });
  },
  listMembers(workspaceId, systemId = null) {
    return request(`/workspaces/${workspaceId}/members/${systemId ? '?system_id='+systemId : ''}`);
  },
  createTable(systemId, name, columns) {
    return request(`/systems/${systemId}/tables/`, { method: 'POST', body: JSON.stringify({ name, columns }) });
  },
  updateColumns(tableId, columns) {
  return request(`/tables/${tableId}/columns/`, {
    method: 'PATCH',
    body: JSON.stringify({ columns }),
  });
},

  deleteRecord(tableId, recordId) {
    return request(`/tables/${tableId}/records/${recordId}/`, {
      method: 'DELETE',
    });
  },

  // ── Notifications ──────────────────────────────────────
  getNotifications() {
    return request('/notifications/');
  },

  getUnreadCount() {
    return request('/notifications/unread_count/');
  },

  markNotificationRead(id) {
    return request('/notifications/mark_as_read/', {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
  },

  markAllRead() {
    return request('/notifications/mark_all_read/', {
      method: 'POST',
    });
  },

  // ── Agent ──────────────────────────────────────────────
  agentApply(systemId, actions) {
    return request(`/systems/${systemId}/agent/apply/`, { method: 'POST', body: JSON.stringify({ actions }) });
  },
  runAgent(systemId, message, actionType = 'chat') {
    return request(`/systems/${systemId}/agent/`, {
      method: 'POST',
      body: JSON.stringify({ message, action_type: actionType }),
    });
  },
};

export function systemToViewData(system) {
  const mainTable = system.tables?.[0];
  if (!mainTable) {
    return { tables: [], headers: [], rows: [], tableId: null, records: [] };
  }

  const headers = mainTable.columns || [];
  const records = mainTable.records || [];
  const rows = records.map((record) =>
    headers.map((col) => record.data?.[col] ?? '')
  );

  return {
    id: system.id,
    userRole: system.user_role || 'owner',
    tables: system.tables.map((t) => t.name),
    headers,
    rows,
    tableId: mainTable.id,
    records,
    allTables: system.tables,
  };
}

export function buildSystemList(systems) {
  return systems.map((system) => {
    const count = system.record_count ?? 0;
    const status = count > 100 ? 'Watch' : count > 0 ? 'Healthy' : 'New';
    return [system.name, `${count} records`, '—', status, String(count)];
  });
}

export function buildSystemsMap(systems) {
  const map = {};
  systems.forEach((system) => {
    map[system.name] = systemToViewData(system);
  });
  return map;
}
