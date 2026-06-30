import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import AgentPanel from './AgentPanel';

const KPI_CONFIG = {
  'CRM': [
    { label: 'Total Opportunities', field: 'Opportunity', type: 'count', icon: '◈', color: '#3b82f6' },
    { label: 'Total Value', field: 'Value', type: 'sum', icon: '$', color: '#22c55e' },
    { label: 'In Negotiation', field: 'Stage', type: 'filter', value: 'Negotiation', icon: '~', color: '#f59e0b' },
    { label: 'Unique Owners', field: 'Owner', type: 'unique', icon: '!', color: '#ef4444' },
  ],
  'Cost Management': [
    { label: 'Total Budget', field: 'Budget', type: 'sum', icon: '$', color: '#22c55e' },
    { label: 'Total Actual', field: 'Actual', type: 'sum', icon: '◈', color: '#3b82f6' },
    { label: 'Over Budget', field: 'Usage', type: 'over', icon: '!', color: '#ef4444' },
    { label: 'Categories', field: 'Category', type: 'count', icon: '▤', color: '#8b5cf6' },
  ],
  'Cash Flow': [
    { label: 'Total Inflows', field: 'Inflows', type: 'sum', icon: '↑', color: '#22c55e' },
    { label: 'Total Outflows', field: 'Outflows', type: 'sum', icon: '↓', color: '#ef4444' },
    { label: 'Critical Periods', field: 'Status', type: 'filter', value: 'Critical', icon: '!', color: '#f59e0b' },
    { label: 'Total Periods', field: 'Period', type: 'count', icon: '◈', color: '#3b82f6' },
  ],
  'Campaigns': [
    { label: 'Total Spend', field: 'Budget', type: 'sum', icon: '$', color: '#22c55e' },
    { label: 'Total Leads', field: 'Leads', type: 'sum', icon: '↑', color: '#3b82f6' },
    { label: 'Active', field: 'Status', type: 'filter', value: 'Active', icon: '◈', color: '#8b5cf6' },
    { label: 'Needs Review', field: 'Status', type: 'filter', value: 'Review', icon: '!', color: '#ef4444' },
  ],
  'Meetings': [
    { label: 'Total Meetings', field: 'Meeting', type: 'count', icon: '◈', color: '#3b82f6' },
    { label: 'Scheduled', field: 'Status', type: 'filter', value: 'Scheduled', icon: '▤', color: '#22c55e' },
    { label: 'Total Actions', field: 'Actions', type: 'sum', icon: '✓', color: '#8b5cf6' },
    { label: 'Pending Decisions', field: 'Decision', type: 'filter', value: 'Pending', icon: '!', color: '#f59e0b' },
  ],
  'Product': [
    { label: 'Total Items', field: 'Item', type: 'count', icon: '◈', color: '#3b82f6' },
    { label: 'Active', field: 'Status', type: 'filter', value: 'Active', icon: '✓', color: '#22c55e' },
    { label: 'Bugs', field: 'Type', type: 'filter', value: 'Bug', icon: '!', color: '#ef4444' },
    { label: 'High Priority', field: 'Priority', type: 'filter', value: 'High', icon: '↑', color: '#f59e0b' },
  ],
};

const STATUS_COLORS = {
  'Active': '#22c55e', 'Done': '#22c55e', 'Healthy': '#22c55e', 'Approved': '#22c55e',
  'Review': '#f59e0b', 'Watch': '#f59e0b', 'Pending': '#f59e0b', 'Open': '#f59e0b',
  'Scheduled': '#3b82f6', 'Critical': '#ef4444', 'Inactive': '#6b7280',
};

const PLATFORM_ICONS = {
  'Google': { bg: '#fff', text: 'G', color: '#4285f4' },
  'Meta': { bg: '#1877f2', text: 'f', color: '#fff' },
  'LinkedIn': { bg: '#0077b5', text: 'in', color: '#fff' },
  'TikTok': { bg: '#000', text: '♪', color: '#fff' },
  'Email': { bg: '#6b7280', text: '@', color: '#fff' },
  'WhatsApp': { bg: '#25d366', text: 'W', color: '#fff' },
};

function parseNum(val) {
  if (!val) return 0;
  return parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
}

function calcKPI(rows, headers, kpi) {
  const idx = headers.indexOf(kpi.field);
  if (idx === -1) return kpi.type === 'count' ? rows.length : '—';
  const vals = rows.map(r => r[idx]);
  if (kpi.type === 'count') return rows.length;
  if (kpi.type === 'sum') {
    const total = vals.reduce((a, b) => a + parseNum(b), 0);
    return total > 999 ? `${(total/1000).toFixed(1)}K` : total.toLocaleString();
  }
  if (kpi.type === 'filter') return vals.filter(v => v === kpi.value).length;
  if (kpi.type === 'unique') return new Set(vals).size;
  if (kpi.type === 'over') return vals.filter(v => parseNum(v) > 100).length;
  return '—';
}

function isLink(cell) {
  const s = String(cell || '');
  return s.startsWith('http://') || s.startsWith('https://') || s.startsWith('www.');
}

function toHref(cell) {
  const s = String(cell);
  return s.startsWith('http') ? s : `https://${s}`;
}

function renderCell(cell, header) {
  if (!cell && cell !== 0) return cell;
  const lh = (header || '').toLowerCase();
  if (lh.includes('link') || lh.includes('url') || isLink(cell)) {
    const domain = String(cell).replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    return (
      <a href={toHref(cell)} target="_blank" rel="noreferrer"
        style={{color:'#3b82f6', display:'inline-flex', alignItems:'center', gap:'6px', textDecoration:'none', fontSize:'13px'}}
        onClick={e => e.stopPropagation()}>
        <span style={{background:'#3b82f622', border:'1px solid #3b82f644', width:'22px', height:'22px',
          borderRadius:'5px', display:'inline-flex', alignItems:'center', justifyContent:'center',
          fontSize:'12px', fontWeight:'700', flexShrink:0}}>↗</span>
        {domain}
      </a>
    );
  }
  if (lh.includes('time') || lh.includes('duration')) {
    return <span style={{color:'#888', fontFamily:'monospace'}}>{cell}</span>;
  }
  const platform = PLATFORM_ICONS[cell];
  if (platform) {
    return (
      <span style={{display:'inline-flex', alignItems:'center', gap:'6px'}}>
        <span style={{background:platform.bg, color:platform.color, width:'20px', height:'20px',
          borderRadius:'4px', fontSize:'11px', fontWeight:'700', display:'inline-flex',
          alignItems:'center', justifyContent:'center'}}>{platform.text}</span>
        {cell}
      </span>
    );
  }
  if (STATUS_COLORS[cell]) {
    return (
      <span style={{background:STATUS_COLORS[cell]+'18', color:STATUS_COLORS[cell],
        border:'1px solid '+STATUS_COLORS[cell]+'33',
        padding:'3px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'500'}}>
        {cell}
      </span>
    );
  }
  return cell;
}

function System({ systemName, systemData, workspaceName, onBack, onOpenModal, onShowDrawer, showToast, onRefresh }) {
  const isViewOnly = systemData.userRole === 'view';
  const [activeTableIdx, setActiveTableIdx] = useState(0);
  const [kpiConfigs, setKpiConfigs] = useState(null);
  const [editingKPIIdx, setEditingKPIIdx] = useState(null);
  const [kpiDraft, setKpiDraft] = useState(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardDraft, setNewCardDraft] = useState({ label: 'New Card', field: '', type: 'count', icon: '◈', color: '#3b82f6' });
  const [showColConfig, setShowColConfig] = useState(false);
  const [configColIdx, setConfigColIdx] = useState(null);
  const [configColName, setConfigColName] = useState('');
  const [configColType, setConfigColType] = useState('text');
  const [filterCol, setFilterCol] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [filterText, setFilterText] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [colMenu, setColMenu] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editingHeader, setEditingHeader] = useState(null);
  const [headerValue, setHeaderValue] = useState('');
  const [showAgent, setShowAgent] = useState(false);
  const [currentSystemView, setCurrentSystemView] = useState(() => localStorage.getItem(`sys_view_${systemData.id}`) || 'table');
  const [reportHtmlContent, setReportHtmlContent] = useState(() => localStorage.getItem(`report_${systemData.id}`) || null);
  const [reportTitle, setReportTitle] = useState(() => localStorage.getItem(`report_title_${systemData.id}`) || '');

  useEffect(() => {
    localStorage.setItem(`sys_view_${systemData.id}`, currentSystemView);
    if (reportHtmlContent) localStorage.setItem(`report_${systemData.id}`, reportHtmlContent);
    else localStorage.removeItem(`report_${systemData.id}`);
    if (reportTitle) localStorage.setItem(`report_title_${systemData.id}`, reportTitle);
    else localStorage.removeItem(`report_title_${systemData.id}`);
  }, [currentSystemView, reportHtmlContent, reportTitle, systemData.id]);

  const activeTable = systemData.allTables?.[activeTableIdx] || systemData.allTables?.[0];
  const tableId = activeTable?.id || systemData.tableId;
  const [rows, setRows] = useState(systemData.rows || []);
  const [records, setRecords] = useState(systemData.records || []);
  const [headers, setHeaders] = useState(systemData.headers || []);

  useEffect(() => {
    setActiveTableIdx(0);
    setEditingKPIIdx(null);
  }, [systemName]);

  useEffect(() => {
    try {
      const key = `kpi_${systemName}_${activeTableIdx}`;
      const stored = localStorage.getItem(key);
      setKpiConfigs(stored ? JSON.parse(stored) : null);
      setEditingKPIIdx(null);
    } catch { setKpiConfigs(null); }
  }, [systemName, activeTableIdx]);

  useEffect(() => {
    if (activeTable) {
      const hdrs = activeTable.columns || [];
      const recs = activeTable.records || [];
      setHeaders(hdrs);
      setRecords(recs);
      setRows(recs.map(record => hdrs.map(col => record.data?.[col] ?? '')));
      setEditingCell(null);
      setEditingHeader(null);
      setActiveFilter('All');
      setFilterCol('');
    }
  }, [activeTable, systemData]);

  const isMainTable = activeTableIdx === 0;
  const hasTemplate = !!(isMainTable && KPI_CONFIG[systemName]);
  const defaultKPIs = hasTemplate ? KPI_CONFIG[systemName] : [];
  const kpis = kpiConfigs && kpiConfigs.length > 0 ? kpiConfigs : defaultKPIs;

  const activeFilterCol = filterCol || (headers.find(h => h.toLowerCase() === 'status') || headers[0] || '');
  const filterColIdx = headers.findIndex(h => h === activeFilterCol);
  const filterValues = filterColIdx >= 0 ? [...new Set(rows.map(r => r[filterColIdx]).filter(Boolean))] : [];
  const filterOptions = ['All', ...filterValues];
  const filteredRows = rows.filter(row => {
    const matchesFilter = activeFilter === 'All' || (filterColIdx >= 0 && row[filterColIdx] === activeFilter);
    const matchesText = !filterText || row.some(cell => String(cell).toLowerCase().includes(filterText.toLowerCase()));
    return matchesFilter && matchesText;
  });

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('.col-menu') && !e.target.closest('.col-header-btn')) setColMenu(null);
      if (!e.target.closest('.row-menu') && !e.target.closest('.row-menu-btn')) setOpenMenu(null);
      if (!e.target.closest('.kpi-settings-panel') && !e.target.closest('.kpi-edit-btn')) setEditingKPIIdx(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const saveColumns = async (newHeaders) => {
    if (!tableId) {
      try {
        const systemId = systemData.id;
        if (!systemId) { showToast('No system ID'); return; }
        await api.createTable(systemId, 'Main Table', newHeaders);
        showToast('Table created!');
        window.location.reload();
      } catch { showToast('Failed to create table'); }
      return;
    }
    try { await api.updateColumns(tableId, newHeaders); }
    catch { showToast('Failed to update columns'); }
  };

  const handleColMenuOpen = (e, idx) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setColMenu({ idx, x: rect.left, y: rect.bottom + window.scrollY });
  };

  const handleAddColumn = () => {
    setColMenu(null);
    setConfigColIdx(null);
    setConfigColName('');
    setConfigColType('text');
    setShowColConfig(true);
  };

  const handleEditColumn = () => {
    const idx = colMenu.idx;
    setColMenu(null);
    setConfigColIdx(idx);
    setConfigColName(headers[idx]);
    setConfigColType('text');
    setShowColConfig(true);
  };

  const saveColConfig = async () => {
    if (!configColName.trim()) return;
    let newHeaders, newRows;
    if (configColIdx === null) {
      newHeaders = [...headers, configColName.trim()];
      newRows = rows.map(row => [...row, '']);
    } else {
      newHeaders = headers.map((h, i) => i === configColIdx ? configColName.trim() : h);
      newRows = rows;
    }
    setHeaders(newHeaders);
    setRows(newRows);
    await saveColumns(newHeaders);
    setShowColConfig(false);
    showToast(configColIdx === null ? 'Column added' : 'Column updated');
  };

  const handleDeleteColumn = async () => {
    const idx = colMenu ? colMenu.idx : configColIdx;
    setColMenu(null);
    setShowColConfig(false);
    if (headers.length <= 1) { showToast('Cannot delete last column'); return; }
    if (!window.confirm(`Delete column "${headers[idx]}"?`)) return;
    const newHeaders = headers.filter((_, i) => i !== idx);
    const newRows = rows.map(row => row.filter((_, i) => i !== idx));
    setHeaders(newHeaders);
    setRows(newRows);
    await saveColumns(newHeaders);
    showToast('Column deleted');
  };

  const saveHeader = async (colIdx) => {
    if (!headerValue.trim()) { setEditingHeader(null); return; }
    const newHeaders = headers.map((h, i) => i === colIdx ? headerValue.trim() : h);
    setHeaders(newHeaders);
    setEditingHeader(null);
    await saveColumns(newHeaders);
    showToast('Column renamed');
  };

  const startEdit = (e, rowIdx, cellIdx, value) => {
    e.stopPropagation();
    if (isViewOnly) return;
    setEditingCell({ rowIdx, cellIdx });
    setEditValue(value);
    setOpenMenu(null);
  };

  const saveEdit = async (rowIdx, cellIdx) => {
    const header = headers[cellIdx];
    const record = records[rowIdx];
    if (!record) { setEditingCell(null); return; }
    const newRows = rows.map((row, rIdx) =>
      rIdx === rowIdx ? row.map((cell, cIdx) => cIdx === cellIdx ? editValue : cell) : row
    );
    setRows(newRows);
    setEditingCell(null);
    if (!tableId) { showToast('No active table ID'); return; }
    try {
      const newData = { ...record.data, [header]: editValue };
      await api.updateRecord(tableId, record.id, newData);
      showToast('Saved');
    } catch {
      showToast('Save failed');
      setRows(rows);
    }
  };

  const handleKeyDown = (e, rowIdx, cellIdx) => {
    if (e.key === 'Enter') saveEdit(rowIdx, cellIdx);
    if (e.key === 'Escape') setEditingCell(null);
  };

  const handleDeleteRow = async (rowIdx) => {
    const record = records[rowIdx];
    if (!record) return;
    if (!tableId) { showToast('No active table ID'); return; }
    try {
      await api.deleteRecord(tableId, record.id);
      setRows(rows.filter((_, i) => i !== rowIdx));
      setRecords(records.filter((_, i) => i !== rowIdx));
      showToast('Deleted');
    } catch { showToast('Delete failed'); }
    setOpenMenu(null);
  };

  const openNewRecord = () => {
    const fields = headers.map(h =>
      `<div style="margin-bottom:12px">
        <label style="display:block;color:#666;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px">${h}</label>
        <input id="field_${h.replace(/\s/g,'_')}" style="width:100%;background:#0d0d0d;color:#fff;border:1px solid #2a2a2a;padding:10px 12px;border-radius:8px;font-size:14px;box-sizing:border-box" placeholder="${h}..." />
      </div>`
    ).join('');
    onOpenModal('New Record', 'Fill in the fields below.',
      `<div>${fields}</div>
       <button onclick="window._submitRecord && window._submitRecord()"
         style="margin-top:16px;background:#fff;color:#000;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600">
         Create Record
       </button>`
    );
    window._submitRecord = async () => {
      const data = {};
      headers.forEach(h => {
        const el = document.getElementById(`field_${h.replace(/\s/g,'_')}`);
        if (el) data[h] = el.value;
      });
      if (!tableId) { showToast('No active table ID'); return; }
      try {
        await api.createRecord(tableId, data);
        showToast('Record created!');
        window.location.reload();
      } catch { showToast('Failed to create record'); }
    };
  };

  const saveKpi = (i) => {
    const base = kpiConfigs && kpiConfigs.length > 0 ? kpiConfigs : defaultKPIs;
    const newConfigs = base.map((k, idx) => idx === i ? kpiDraft : k);
    setKpiConfigs(newConfigs);
    localStorage.setItem(`kpi_${systemName}_${activeTableIdx}`, JSON.stringify(newConfigs));
    setEditingKPIIdx(null);
    showToast('Card updated');
  };

  return (
    <section id="system" style={{padding:'32px 40px'}}>
      <div className="back" onClick={onBack} style={{marginBottom:'8px'}}>← Back to Systems</div>
      <div className="system-top-row" style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'32px'}}>
        <div>
          <div style={{color:'#555', fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'4px'}}>{workspaceName || 'Workspace'}</div>
          <h1 style={{fontSize:'32px', fontWeight:'700', margin:'0 0 4px 0', color:'#fff'}}>{systemName}</h1>
          <div style={{color:'#555', fontSize:'14px'}}>Smart operating table — manage, track, and execute work.</div>
        </div>
        <div className="system-actions-row" style={{display:'flex', gap:'10px', alignItems:'center'}}>
          <button onClick={() => onOpenModal('Share Access', 'Invite people to this workspace.', '__INVITE__')}
            style={{background:'#111', color:'#ccc', border:'1px solid #2a2a2a', padding:'10px 18px', borderRadius:'8px', cursor:'pointer', fontSize:'13px'}}>Share</button>
          <button onClick={() => setCurrentSystemView(v => v === 'table' ? 'report' : 'table')}
            style={{background: currentSystemView === 'report' ? '#fff' : '#111', color: currentSystemView === 'report' ? '#000' : '#ccc', border:'1px solid #2a2a2a', padding:'10px 18px', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight: currentSystemView === 'report' ? '700' : '400'}}>
            {currentSystemView === 'report' ? 'Back to Table' : 'Reports'}
          </button>
          <button onClick={() => showToast('Export coming soon')}
            style={{background:'#111', color:'#ccc', border:'1px solid #2a2a2a', padding:'10px 18px', borderRadius:'8px', cursor:'pointer', fontSize:'13px'}}>Export</button>
          <button onClick={openNewRecord}
            style={{background:'#fff', color:'#000', border:'none', padding:'10px 20px', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:'700', display: isViewOnly ? 'none' : ''}}>
            + New Record
          </button>
          <button onClick={() => setShowAgent(true)}
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', border: 'none',
              padding: '10px 18px', borderRadius: '8px',
              cursor: 'pointer', fontSize: '13px', fontWeight: '700',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
            ✦ Agent
          </button>
        </div>
      </div>

      {currentSystemView === 'table' && (
        <>
      <div className="table-tabs" style={{display:'flex', gap:'8px', marginBottom:'24px', overflowX:'auto', paddingBottom:'4px'}}>
        {systemData.allTables?.map((t, idx) => (
          <button key={t.id || idx} onClick={() => setActiveTableIdx(idx)}
            style={{
              background: activeTableIdx === idx ? '#fff' : '#111',
              color: activeTableIdx === idx ? '#000' : '#888',
              border: `1px solid ${activeTableIdx === idx ? '#fff' : '#222'}`,
              padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
              fontSize: '13px', fontWeight: activeTableIdx === idx ? '600' : '400',
              whiteSpace: 'nowrap'
            }}>
            {t.name}
          </button>
        ))}
        {!isViewOnly && (
          <button onClick={() => {
            const name = prompt('New table name:');
            if (name) {
              import('../services/api').then(({api}) => {
                api.createTable(systemData.id, name, ['Name'])
                  .then(() => window.location.reload())
                  .catch(() => showToast('Failed to create table'));
              });
            }
          }} style={{
            background: 'transparent', color: '#666', border: '1px dashed #333',
            padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
            display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
          }}>
            + New Table
          </button>
        )}
      </div>      <div className="kpi-grid">
        {kpis.map((kpi, i) => (
          <div key={i} className="kpi-card"
            onMouseEnter={e => { const btn = e.currentTarget.querySelector('.kpi-edit-btn'); if(btn) btn.style.opacity='1'; }}
            onMouseLeave={e => { const btn = e.currentTarget.querySelector('.kpi-edit-btn'); if(editingKPIIdx !== i && btn) btn.style.opacity='0'; }}>
            <button className="kpi-edit-btn"
              onClick={e => { e.stopPropagation(); if(editingKPIIdx===i){setEditingKPIIdx(null);}else{setEditingKPIIdx(i);setKpiDraft({...kpi});} }}
              style={{position:'absolute', top:'12px', right:'12px', background:'#1a1a1a', border:'1px solid #2a2a2a',
                color:'#666', width:'24px', height:'24px', borderRadius:'6px', cursor:'pointer', fontSize:'11px',
                opacity: editingKPIIdx===i ? '1' : '0', transition:'opacity 0.2s',
                display:'flex', alignItems:'center', justifyContent:'center', padding:'0', lineHeight:'1'}}>✎</button>
            {editingKPIIdx === i && kpiDraft && (
              <div className="kpi-settings-panel" onClick={e => e.stopPropagation()}
                style={{position:'absolute', top:'44px', right:'0', left:'0', background:'#141414',
                  border:'1px solid #2a2a2a', borderRadius:'12px', padding:'16px', zIndex:500,
                  boxShadow:'0 12px 32px rgba(0,0,0,0.85)'}}>
                <div style={{fontSize:'11px', color:'#555', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'12px', fontWeight:'600'}}>Card Settings</div>
                <div style={{marginBottom:'10px'}}>
                  <div style={{fontSize:'11px', color:'#555', marginBottom:'4px'}}>Title</div>
                  <input value={kpiDraft.label} onChange={e => setKpiDraft({...kpiDraft, label: e.target.value})}
                    style={{width:'100%', background:'#0d0d0d', color:'#fff', border:'1px solid #2a2a2a',
                      padding:'7px 10px', borderRadius:'6px', fontSize:'12px', outline:'none', boxSizing:'border-box'}} />
                </div>
                <div style={{marginBottom:'10px'}}>
                  <div style={{fontSize:'11px', color:'#555', marginBottom:'4px'}}>Field</div>
                  <select value={kpiDraft.field} onChange={e => setKpiDraft({...kpiDraft, field: e.target.value})}
                    style={{width:'100%', background:'#0d0d0d', color:'#fff', border:'1px solid #2a2a2a',
                      padding:'7px 10px', borderRadius:'6px', fontSize:'12px', outline:'none', boxSizing:'border-box'}}>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:'10px'}}>
                  <div style={{fontSize:'11px', color:'#555', marginBottom:'4px'}}>Calculation</div>
                  <select value={kpiDraft.type} onChange={e => setKpiDraft({...kpiDraft, type: e.target.value})}
                    style={{width:'100%', background:'#0d0d0d', color:'#fff', border:'1px solid #2a2a2a',
                      padding:'7px 10px', borderRadius:'6px', fontSize:'12px', outline:'none', boxSizing:'border-box'}}>
                    <option value="count">Count (total rows)</option>
                    <option value="sum">Sum (numeric)</option>
                    <option value="unique">Unique values</option>
                    <option value="filter">Filter equals</option>
                  </select>
                </div>
                {kpiDraft.type === 'filter' && (
                  <div style={{marginBottom:'10px'}}>
                    <div style={{fontSize:'11px', color:'#555', marginBottom:'4px'}}>Match value</div>
                    <input value={kpiDraft.value || ''} onChange={e => setKpiDraft({...kpiDraft, value: e.target.value})}
                      placeholder="e.g. Active, Done..."
                      style={{width:'100%', background:'#0d0d0d', color:'#fff', border:'1px solid #2a2a2a',
                        padding:'7px 10px', borderRadius:'6px', fontSize:'12px', outline:'none', boxSizing:'border-box'}} />
                  </div>
                )}
                <div style={{marginBottom:'14px'}}>
                  <div style={{fontSize:'11px', color:'#555', marginBottom:'6px'}}>Color</div>
                  <div style={{display:'flex', gap:'6px', flexWrap:'wrap'}}>
                    {['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316'].map(c => (
                      <div key={c} onClick={() => setKpiDraft({...kpiDraft, color: c})}
                        style={{width:'22px', height:'22px', borderRadius:'50%', background:c, cursor:'pointer',
                          border: kpiDraft.color===c ? '2px solid #fff' : '2px solid transparent', boxSizing:'border-box'}} />
                    ))}
                  </div>
                </div>
                <div style={{display:'flex', gap:'8px'}}>
                  <button onClick={() => saveKpi(i)}
                    style={{flex:1, background:'#fff', color:'#000', border:'none', padding:'8px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontWeight:'700'}}>Save</button>
                  <button onClick={() => setEditingKPIIdx(null)}
                    style={{flex:1, background:'transparent', color:'#666', border:'1px solid #2a2a2a', padding:'8px', borderRadius:'6px', cursor:'pointer', fontSize:'12px'}}>Cancel</button>
                </div>
              </div>
            )}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px'}}>
              <div style={{color:'#666', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.08em', paddingRight:'16px'}}>{kpi.label}</div>
              <div style={{background:kpi.color+'22', color:kpi.color, width:'30px', height:'30px', borderRadius:'8px', flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'700'}}>{kpi.icon}</div>
            </div>
            <div style={{color:'#fff', fontSize:'30px', fontWeight:'700', marginBottom:'6px'}}>{calcKPI(rows, headers, kpi)}</div>
            <div style={{color:'#444', fontSize:'12px'}}>from {rows.length} active records</div>
          </div>
        ))}
        <div onClick={() => { setNewCardDraft({ label: 'New Card', field: headers[0] || '', type: 'count', icon: '◈', color: '#3b82f6' }); setShowAddCard(true); }}
          style={{display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
            border:'1px dashed #2a2a2a', borderRadius:'12px', minHeight:'120px', color:'#444',
            fontSize:'24px', background:'transparent', transition:'border-color 0.2s'}}
          onMouseEnter={e => e.currentTarget.style.borderColor='#555'}
          onMouseLeave={e => e.currentTarget.style.borderColor='#2a2a2a'}>+</div>
      </div>

      {headers.length > 0 && (
        <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px', flexWrap:'wrap'}}>
          <select value={activeFilterCol} onChange={e => { setFilterCol(e.target.value); setActiveFilter('All'); }}
            style={{background:'#111', color:'#777', border:'1px solid #222', padding:'5px 12px',
              borderRadius:'20px', fontSize:'13px', cursor:'pointer', outline:'none'}}>
            {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          {filterOptions.map(opt => (
            <button key={opt} onClick={() => setActiveFilter(opt)}
              style={{background:activeFilter===opt?'#fff':'#111', color:activeFilter===opt?'#000':'#777',
                border:'1px solid '+(activeFilter===opt?'#fff':'#222'),
                padding:'5px 16px', borderRadius:'20px', fontSize:'13px', cursor:'pointer',
                fontWeight:activeFilter===opt?'600':'400'}}>
              {opt}
            </button>
          ))}
          <div style={{marginLeft:'auto'}}>
            <input placeholder="Search..." value={filterText} onChange={e => setFilterText(e.target.value)}
              style={{background:'#111', color:'#fff', border:'1px solid #222', padding:'6px 14px',
                borderRadius:'8px', fontSize:'13px', outline:'none', width:'180px'}} />
          </div>
        </div>
      )}

      {colMenu && (
        <div className="col-menu" style={{position:'fixed', left:colMenu.x, top:colMenu.y,
          background:'#161616', border:'1px solid #2a2a2a', borderRadius:'10px', zIndex:9999,
          minWidth:'160px', overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.6)'}}>
          <div onClick={handleEditColumn} style={{padding:'10px 16px', cursor:'pointer', color:'#ccc', fontSize:'13px'}}
            onMouseEnter={e => e.currentTarget.style.background='#222'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>✎ Edit Column</div>
          <div onClick={handleAddColumn} style={{padding:'10px 16px', cursor:'pointer', color:'#ccc', fontSize:'13px'}}
            onMouseEnter={e => e.currentTarget.style.background='#222'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>+ Add Column</div>
          <div style={{height:'1px', background:'#222'}}></div>
          <div onClick={handleDeleteColumn} style={{padding:'10px 16px', cursor:'pointer', color:'#ef4444', fontSize:'13px'}}
            onMouseEnter={e => e.currentTarget.style.background='#222'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}>Delete Column</div>
        </div>
      )}

      <div className="table-scroll-wrap" style={{background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:'12px'}}>
        <table style={{borderCollapse:'collapse'}}>
          <thead>
            <tr style={{borderBottom:'1px solid #1a1a1a'}}>
              <th style={{width:'40px'}}></th>
              {headers.map((h, i) => (
                <th key={i} style={{padding:'12px 16px', textAlign:'left'}}>
                  {editingHeader === i ? (
                    <input autoFocus value={headerValue}
                      onChange={e => setHeaderValue(e.target.value)}
                      onBlur={() => saveHeader(i)}
                      onKeyDown={e => { if(e.key==='Enter') saveHeader(i); if(e.key==='Escape') setEditingHeader(null); }}
                      style={{background:'#1a1a2e', color:'#fff', border:'1px solid #444', padding:'4px 8px',
                        borderRadius:'4px', fontSize:'12px', outline:'none', width:'100%'}}
                    />
                  ) : (
                    <button className="col-header-btn" onClick={(e) => handleColMenuOpen(e, i)}
                      style={{background:'none', border:'none', cursor:'pointer', color:'#555',
                        fontSize:'12px', letterSpacing:'0.03em', fontWeight:'600',
                        display:'flex', alignItems:'center', gap:'6px', padding:'0',
                        maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'capitalize'}}>
                      <span style={{overflow:'hidden', textOverflow:'ellipsis'}}>{h}</span> <span style={{opacity:0.4}}>▾</span>
                    </button>
                  )}
                </th>
              ))}
              <th style={{width:'50px', textAlign:'center'}}>
                <button onClick={handleAddColumn}
                  style={{background:'none', border:'none', color:'#444', cursor:'pointer', fontSize:'18px'}}>+</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, rowIdx) => (
              <tr key={rowIdx} style={{borderBottom:'1px solid #141414', transition: 'background 0.2s'}}
                onMouseEnter={e => e.currentTarget.style.background='#131313'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <td style={{textAlign:'center', color:'#333', cursor:'pointer', fontSize:'13px', padding:'14px 8px'}}
                  onClick={(e) => startEdit(e, rowIdx, 0, row[0])}>✎</td>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} style={{padding:'14px 16px', fontSize:'14px', color:'#ccc', cursor:'pointer',
                    maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.5'}}
                    onClick={(e) => startEdit(e, rowIdx, cellIdx, cell)}>
                    {editingCell?.rowIdx===rowIdx && editingCell?.cellIdx===cellIdx ? (
                      <input autoFocus value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={() => saveEdit(rowIdx, cellIdx)}
                        onKeyDown={e => handleKeyDown(e, rowIdx, cellIdx)}
                        onClick={e => e.stopPropagation()}
                        style={{background:'#1a1a2e', color:'#fff', border:'1px solid #444', padding:'4px 8px',
                          borderRadius:'4px', width:'100%', fontSize:'inherit', outline:'none'}}
                      />
                    ) : renderCell(cell, headers[cellIdx])}
                  </td>
                ))}
                <td style={{padding:'14px 8px', textAlign:'center', position:'relative'}}>
                  <button className="row-menu-btn"
                    onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu===rowIdx?null:rowIdx); }}
                    style={{background:'none', border:'none', color:'#444', cursor:'pointer', fontSize:'18px', padding:'0 8px'}}>⋮</button>
                  {openMenu === rowIdx && (
                    <div className="row-menu" style={{position:'absolute', right:'8px', top:'100%', background:'#161616',
                      border:'1px solid #2a2a2a', borderRadius:'10px', zIndex:100, minWidth:'140px',
                      overflow:'hidden', boxShadow:'0 8px 24px rgba(0,0,0,0.5)'}}>
                      <div onClick={(e) => startEdit(e, rowIdx, 0, row[0])}
                        style={{padding:'10px 16px', cursor:'pointer', color:'#ccc', fontSize:'13px'}}
                        onMouseEnter={e => e.currentTarget.style.background='#222'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>Edit</div>
                      <div onClick={() => { onShowDrawer(`<div class="modal-head"><div><h2>${row[0]}</h2></div></div>`); setOpenMenu(null); }}
                        style={{padding:'10px 16px', cursor:'pointer', color:'#ccc', fontSize:'13px'}}
                        onMouseEnter={e => e.currentTarget.style.background='#222'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>View</div>
                      <div style={{height:'1px', background:'#222'}}></div>
                      <div onClick={() => handleDeleteRow(rowIdx)}
                        style={{padding:'10px 16px', cursor:'pointer', color:'#ef4444', fontSize:'13px'}}
                        onMouseEnter={e => e.currentTarget.style.background='#222'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>Delete</div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {rows.length > 0 && (
              <tr style={{borderTop:'2px solid #1a1a1a', background:'#0d0d0d'}}>
                <td></td>
                {headers.map((h, i) => {
                  const lh = h.toLowerCase();
                  const isSkip = lh.includes('time') || lh.includes('link') || lh.includes('url') || lh.includes('duration') || lh.includes('date') || lh.includes('day') || lh.includes('month') || lh.includes('year') || lh.includes('id') || lh.includes('status') || lh.includes('owner') || lh.includes('person') || lh.includes('phone') || lh.includes('mobile') || lh.includes('contact');
                  const vals = rows.map(r => parseFloat(String(r[i]).replace(/[^0-9.]/g,'')));
                  const isNum = !isSkip && vals.some(v => !isNaN(v) && v > 0);
                  const total = vals.reduce((a,b) => a+(isNaN(b)?0:b), 0);
                  return (
                    <td key={i} style={{padding:'12px 16px', color:'#666', fontSize:'13px', fontWeight:'600'}}>
                      {i===0 ? 'Total' : isNum ? total.toLocaleString() : ''}
                    </td>
                  );
                })}
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{color:'#333', fontSize:'12px', marginTop:'10px'}}>All figures compared to previous period</div>

      {showColConfig && (
        <div className="overlay" onClick={() => setShowColConfig(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:'400px'}}>
            <div className="modal-head">
              <div><h2>{configColIdx === null ? 'Add Column' : 'Edit Column'}</h2><div className="sub">Configure column settings</div></div>
              <button className="close" onClick={() => setShowColConfig(false)}>Close</button>
            </div>
            <div style={{padding:'8px 0'}}>
              <div style={{marginBottom:'16px'}}>
                <div style={{color:'#666', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px'}}>Column Name</div>
                <input autoFocus value={configColName} onChange={e => setConfigColName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveColConfig()}
                  placeholder="e.g. Status, Owner, Due Date"
                  style={{width:'100%', background:'#0d0d0d', color:'#fff', border:'1px solid #2a2a2a',
                    padding:'10px 12px', borderRadius:'8px', fontSize:'14px', outline:'none', boxSizing:'border-box'}}/>
              </div>
              <div style={{marginBottom:'24px'}}>
                <div style={{color:'#666', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px'}}>Column Type</div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                  {[['text','📝 Text'],['number','🔢 Number'],['date','📅 Date'],['status','🏷 Status'],['dropdown','▾ Dropdown'],['link','🔗 Link']].map(([val, label]) => (
                    <button key={val} onClick={() => setConfigColType(val)}
                      style={{background: configColType===val ? '#fff' : '#111', color: configColType===val ? '#000' : '#777',
                        border:'1px solid '+(configColType===val?'#fff':'#222'), padding:'10px', borderRadius:'8px',
                        fontSize:'13px', cursor:'pointer', textAlign:'left'}}>{label}</button>
                  ))}
                </div>
              </div>
              <div style={{display:'flex', gap:'8px'}}>
                {configColIdx !== null && (
                  <button onClick={handleDeleteColumn}
                    style={{background:'#ef444418', color:'#ef4444', border:'1px solid #ef444433',
                      padding:'10px 20px', borderRadius:'8px', fontSize:'14px', cursor:'pointer'}}>Delete</button>
                )}
                <button onClick={saveColConfig}
                  style={{flex:1, background:'#fff', color:'#000', border:'none',
                    padding:'10px', borderRadius:'8px', fontSize:'14px', fontWeight:'700', cursor:'pointer'}}>
                  {configColIdx === null ? 'Add Column' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddCard && (
        <div className="overlay" onClick={() => setShowAddCard(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:'420px'}}>
            <div className="modal-head">
              <div><h2>Add Card</h2><div className="sub">Choose what this card shows</div></div>
              <button className="close" onClick={() => setShowAddCard(false)}>Close</button>
            </div>
            <div style={{padding:'8px 0'}}>
              <div style={{marginBottom:'16px'}}>
                <div style={{color:'#666', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px'}}>Card Title</div>
                <input value={newCardDraft.label} onChange={e => setNewCardDraft({...newCardDraft, label: e.target.value})}
                  style={{width:'100%', background:'#0d0d0d', color:'#fff', border:'1px solid #2a2a2a',
                    padding:'10px 12px', borderRadius:'8px', fontSize:'14px', outline:'none', boxSizing:'border-box'}}/>
              </div>
              <div style={{marginBottom:'16px'}}>
                <div style={{color:'#666', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px'}}>Column</div>
                <select value={newCardDraft.field} onChange={e => setNewCardDraft({...newCardDraft, field: e.target.value})}
                  style={{width:'100%', background:'#0d0d0d', color:'#fff', border:'1px solid #2a2a2a',
                    padding:'10px 12px', borderRadius:'8px', fontSize:'14px', outline:'none'}}>
                  {headers.length > 0 ? headers.map(h => <option key={h} value={h}>{h}</option>) : <option value="">No columns yet</option>}
                </select>
              </div>
              <div style={{marginBottom:'24px'}}>
                <div style={{color:'#666', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px'}}>Calculation</div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                  {[['count','Count (total rows)'],['sum','Sum'],['unique','Unique Values'],['filter','Filtered Count']].map(([val, label]) => (
                    <button key={val} onClick={() => setNewCardDraft({...newCardDraft, type: val})}
                      style={{background: newCardDraft.type===val ? '#fff' : '#111', color: newCardDraft.type===val ? '#000' : '#777',
                        border:'1px solid '+(newCardDraft.type===val?'#fff':'#222'), padding:'10px', borderRadius:'8px',
                        fontSize:'13px', cursor:'pointer'}}>{label}</button>
                  ))}
                </div>
              </div>
              <div style={{marginBottom:'24px'}}>
                <div style={{color:'#666', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px'}}>Color</div>
                <div style={{display:'flex', gap:'8px'}}>
                  {['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316'].map(c => (
                    <div key={c} onClick={() => setNewCardDraft({...newCardDraft, color: c})}
                      style={{width:'28px', height:'28px', borderRadius:'50%', background:c, cursor:'pointer',
                        border: newCardDraft.color===c ? '3px solid #fff' : '3px solid transparent'}}/>
                  ))}
                </div>
              </div>
              <button onClick={() => {
                  const newKpis = [...kpis, newCardDraft];
                  setKpiConfigs(newKpis);
                  localStorage.setItem(`kpi_${systemName}_${activeTableIdx}`, JSON.stringify(newKpis));
                  setShowAddCard(false);
                  showToast('Card added');
                }}
                style={{width:'100%', background:'#fff', color:'#000', border:'none',
                  padding:'12px', borderRadius:'8px', fontSize:'14px', fontWeight:'700', cursor:'pointer'}}>
                Add Card
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {currentSystemView === 'report' && (
        <div style={{background:'#111', padding:'40px', borderRadius:'16px', minHeight:'500px'}}>
          {reportHtmlContent ? (
            <div className="report-content" dangerouslySetInnerHTML={{ __html: reportHtmlContent }} style={{lineHeight: '1.6', color:'#ddd'}} />
          ) : (
            <div style={{textAlign:'center', color:'#888', paddingTop:'80px'}}>
              <h2 style={{color:'#eee', marginBottom:'16px'}}>No Report Generated Yet</h2>
              <p style={{marginBottom:'24px'}}>Use the Struct Agent to analyze this system and generate a comprehensive report.</p>
              <button onClick={() => setShowAgent(true)} style={{background:'linear-gradient(135deg, #6366f1, #8b5cf6)', color:'#fff', border:'none', padding:'12px 24px', borderRadius:'8px', cursor:'pointer', fontSize:'14px', fontWeight:'700'}}>
                ✦ Open Agent
              </button>
            </div>
          )}
        </div>
      )}

      {showAgent && (
        <AgentPanel
          systemId={systemData.id}
          systemName={systemName}
          onClose={() => setShowAgent(false)}
          showToast={showToast}
          onRefresh={onRefresh}
          onOpenReport={(html, title) => {
            setReportHtmlContent(html);
            setReportTitle(title);
            setCurrentSystemView('report');
            setShowAgent(false);
          }}
        />
      )}

      {showColConfig && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.8)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{background:'#161616', border:'1px solid #2a2a2a', borderRadius:'16px', width:'400px', overflow:'hidden', boxShadow:'0 20px 40px rgba(0,0,0,0.5)'}}>
            <div style={{padding:'20px 24px', borderBottom:'1px solid #2a2a2a', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h3 style={{margin:0, color:'#fff', fontSize:'16px'}}>{configColIdx === null ? 'Add Column' : 'Edit Column'}</h3>
              <button onClick={() => setShowColConfig(false)} style={{background:'none', border:'none', color:'#888', cursor:'pointer', fontSize:'20px'}}>&times;</button>
            </div>
            <div style={{padding:'24px'}}>
              <div style={{marginBottom:'20px'}}>
                <div style={{color:'#888', fontSize:'12px', marginBottom:'8px'}}>Column Name</div>
                <input autoFocus value={configColName} onChange={e => setConfigColName(e.target.value)}
                  onKeyDown={e => { if(e.key === 'Enter') saveColConfig(); }}
                  style={{width:'100%', background:'#0a0a0a', border:'1px solid #2a2a2a', color:'#fff', padding:'10px 14px', borderRadius:'8px', fontSize:'14px', outline:'none', boxSizing:'border-box'}} />
              </div>
              <button onClick={saveColConfig}
                style={{width:'100%', background:'#fff', color:'#000', border:'none', padding:'12px', borderRadius:'8px', fontSize:'14px', fontWeight:'700', cursor:'pointer'}}>
                {configColIdx === null ? 'Add Column' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default System;
