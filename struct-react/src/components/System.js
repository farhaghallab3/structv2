import React, { useState } from 'react';
import { api } from '../services/api';

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
  'Twitter': { bg: '#1da1f2', text: 'X', color: '#fff' },
};

function getRoasColor(val) {
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  if (isNaN(n)) return null;
  if (n >= 2) return '#22c55e';
  if (n >= 1) return '#f59e0b';
  return '#ef4444';
}

function getNumericColor(val, header) {
  const lh = header.toLowerCase();
  if (lh.includes('roas') || lh.includes('return')) return getRoasColor(val);
  if (lh.includes('variance') || lh.includes('usage')) {
    const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    if (isNaN(n)) return null;
    if (String(val).startsWith('-')) return '#22c55e';
    if (String(val).startsWith('+') || n > 100) return '#ef4444';
    return null;
  }
  return null;
}

function parseNum(val) {
  if (!val) return 0;
  return parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
}

function calcKPI(records, headers, kpi) {
  const idx = headers.indexOf(kpi.field);
  if (idx === -1) return '—';
  const vals = records.map(r => r[idx]);
  if (kpi.type === 'count') return records.length;
  if (kpi.type === 'sum') {
    const total = vals.reduce((a, b) => a + parseNum(b), 0);
    return total > 999 ? `${(total / 1000).toFixed(1)}K` : total.toLocaleString();
  }
  if (kpi.type === 'filter') return vals.filter(v => v === kpi.value).length;
  if (kpi.type === 'unique') return new Set(vals).size;
  if (kpi.type === 'over') return vals.filter(v => parseNum(v) > 100).length;
  return '—';
}

function renderCell(cell, header) {
  // Platform icon
  const platform = PLATFORM_ICONS[cell];
  if (platform) {
    return (
      <span style={{display:'inline-flex', alignItems:'center', gap:'6px'}}>
        <span style={{background: platform.bg, color: platform.color, width:'20px', height:'20px',
          borderRadius:'4px', fontSize:'11px', fontWeight:'700', display:'inline-flex',
          alignItems:'center', justifyContent:'center'}}>
          {platform.text}
        </span>
        {cell}
      </span>
    );
  }

  // Status badge
  if (STATUS_COLORS[cell]) {
    return (
      <span style={{background: STATUS_COLORS[cell] + '18', color: STATUS_COLORS[cell],
        border:'1px solid '+ STATUS_COLORS[cell]+'33',
        padding:'3px 12px', borderRadius:'20px', fontSize:'12px', fontWeight:'500'}}>
        {cell}
      </span>
    );
  }

  // Numeric color (ROAS, variance)
  const numColor = getNumericColor(cell, header);
  if (numColor) {
    return <span style={{color: numColor, fontWeight:'600'}}>{cell}</span>;
  }

  return cell;
}

function System({ systemName, systemData, workspaceName, onBack, onOpenModal, onShowDrawer, showToast }) {
  const [rows, setRows] = useState(systemData.rows);
  const [records, setRecords] = useState(systemData.records);
  const [headers] = useState(systemData.headers);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [filterText, setFilterText] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [openMenu, setOpenMenu] = useState(null);

  const kpis = KPI_CONFIG[systemName] || [
    { label: 'Total Records', field: headers[0], type: 'count', icon: '◈', color: '#3b82f6' },
    { label: 'Unique', field: headers[1] || headers[0], type: 'unique', icon: '▤', color: '#22c55e' },
  ];

  const statusCol = headers.findIndex(h => h.toLowerCase() === 'status');
  const statusValues = statusCol >= 0 ? [...new Set(rows.map(r => r[statusCol]).filter(Boolean))] : [];
  const filterOptions = ['All', ...statusValues];

  const filteredRows = rows.filter(row => {
    const matchesStatus = activeFilter === 'All' || (statusCol >= 0 && row[statusCol] === activeFilter);
    const matchesText = !filterText || row.some(cell => String(cell).toLowerCase().includes(filterText.toLowerCase()));
    return matchesStatus && matchesText;
  });

  const startEdit = (e, rowIdx, cellIdx, value) => {
    e.stopPropagation();
    setEditingCell({ rowIdx, cellIdx });
    setEditValue(value);
    setOpenMenu(null);
  };

  const saveEdit = async (rowIdx, cellIdx) => {
    const header = headers[cellIdx];
    const record = records[rowIdx];
    if (!record) { setEditingCell(null); return; }
    const newRows = rows.map((row, rIdx) =>
      rIdx === rowIdx ? row.map((cell, cIdx) => (cIdx === cellIdx ? editValue : cell)) : row
    );
    setRows(newRows);
    setEditingCell(null);
    try {
      const newData = { ...record.data, [header]: editValue };
      await api.updateRecord(systemData.tableId, record.id, newData);
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
    try {
      await api.deleteRecord(systemData.tableId, record.id);
      setRows(rows.filter((_, i) => i !== rowIdx));
      setRecords(records.filter((_, i) => i !== rowIdx));
      showToast('Deleted');
    } catch {
      showToast('Delete failed');
    }
    setOpenMenu(null);
  };

  const openNewRecord = () => {
    const fields = headers.map(h =>
      `<div style="margin-bottom:12px">
        <label style="display:block;color:#666;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:6px">${h}</label>
        <input id="field_${h.replace(/\s/g, '_')}" style="width:100%;background:#0d0d0d;color:#fff;border:1px solid #2a2a2a;padding:10px 12px;border-radius:8px;font-size:14px;box-sizing:border-box" placeholder="${h}..." />
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
        const el = document.getElementById(`field_${h.replace(/\s/g, '_')}`);
        if (el) data[h] = el.value;
      });
      try {
        await api.createRecord(systemData.tableId, data);
        showToast('Record created!');
        window.location.reload();
      } catch {
        showToast('Failed to create record');
      }
    };
  };

  return (
    <section id="system" style={{padding:'32px 40px'}}>
      <div className="back" onClick={onBack} style={{marginBottom:'8px'}}>← Back to Systems</div>

      {/* Header */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'32px'}}>
        <div>
          <div style={{color:'#555', fontSize:'12px', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:'4px'}}>{workspaceName || 'Workspace'}</div>
          <h1 style={{fontSize:'32px', fontWeight:'700', margin:'0 0 4px 0', color:'#fff'}}>{systemName}</h1>
          <div style={{color:'#555', fontSize:'14px'}}>Smart operating table — manage, track, and execute work.</div>
        </div>
        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
          <button onClick={() => showToast('Reports coming soon')}
            style={{background:'#111', color:'#ccc', border:'1px solid #2a2a2a', padding:'10px 18px', borderRadius:'8px', cursor:'pointer', fontSize:'13px'}}>
            Reports
          </button>
          <button onClick={() => showToast('Export coming soon')}
            style={{background:'#111', color:'#ccc', border:'1px solid #2a2a2a', padding:'10px 18px', borderRadius:'8px', cursor:'pointer', fontSize:'13px'}}>
            Export
          </button>
          <button onClick={openNewRecord}
            style={{background:'#fff', color:'#000', border:'none', padding:'10px 20px', borderRadius:'8px', cursor:'pointer', fontSize:'13px', fontWeight:'700'}}>
            + New Record
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'28px'}}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{background:'#0f0f0f', border:'1px solid #1f1f1f', borderRadius:'14px', padding:'20px 24px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px'}}>
              <div style={{color:'#666', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.08em'}}>{kpi.label}</div>
              <div style={{background: kpi.color + '22', color: kpi.color, width:'30px', height:'30px', borderRadius:'8px',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'700'}}>
                {kpi.icon}
              </div>
            </div>
            <div style={{color:'#fff', fontSize:'30px', fontWeight:'700', marginBottom:'6px'}}>
              {calcKPI(rows, headers, kpi)}
            </div>
            <div style={{color:'#444', fontSize:'12px'}}>from {rows.length} active records</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px', flexWrap:'wrap'}}>
        {filterOptions.map(opt => (
          <button key={opt} onClick={() => setActiveFilter(opt)}
            style={{background: activeFilter === opt ? '#fff' : '#111', color: activeFilter === opt ? '#000' : '#777',
              border:'1px solid '+(activeFilter === opt ? '#fff' : '#222'),
              padding:'5px 16px', borderRadius:'20px', fontSize:'13px', cursor:'pointer',
              fontWeight: activeFilter === opt ? '600' : '400'}}>
            {opt}
          </button>
        ))}
        <div style={{marginLeft:'auto'}}>
          <input placeholder="Search..." value={filterText} onChange={e => setFilterText(e.target.value)}
            style={{background:'#111', color:'#fff', border:'1px solid #222', padding:'6px 14px',
              borderRadius:'8px', fontSize:'13px', outline:'none', width:'180px'}} />
        </div>
      </div>

      {/* Table */}
      <div style={{background:'#0a0a0a', border:'1px solid #1a1a1a', borderRadius:'12px', overflow:'hidden'}}>
        <table style={{width:'100%', borderCollapse:'collapse'}}>
          <thead>
            <tr style={{borderBottom:'1px solid #1a1a1a'}}>
              <th style={{width:'40px'}}></th>
              {headers.map((h, i) => (
                <th key={i} style={{padding:'12px 16px', textAlign:'left', color:'#444', fontSize:'11px',
                  textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:'500'}}>
                  {h}
                </th>
              ))}
              <th style={{width:'40px'}}></th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, rowIdx) => (
              <tr key={rowIdx} style={{borderBottom:'1px solid #111'}}
                onMouseEnter={e => e.currentTarget.style.background='#0f0f0f'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <td style={{textAlign:'center', color:'#333', cursor:'pointer', fontSize:'13px', padding:'14px 8px'}}
                  onClick={(e) => startEdit(e, rowIdx, 0, row[0])}>✎</td>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} style={{padding:'14px 16px', fontSize:'14px', color:'#ccc', cursor:'pointer'}}
                    onClick={(e) => startEdit(e, rowIdx, cellIdx, cell)}>
                    {editingCell?.rowIdx === rowIdx && editingCell?.cellIdx === cellIdx ? (
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
                  <button onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === rowIdx ? null : rowIdx); }}
                    style={{background:'none', border:'none', color:'#444', cursor:'pointer', fontSize:'18px', padding:'0 8px'}}>
                    ⋮
                  </button>
                  {openMenu === rowIdx && (
                    <div style={{position:'absolute', right:'8px', top:'100%', background:'#161616',
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
                  const vals = rows.map(r => parseFloat(String(r[i]).replace(/[^0-9.]/g, '')));
                  const isNum = vals.some(v => !isNaN(v) && v > 0);
                  const total = vals.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
                  return (
                    <td key={i} style={{padding:'12px 16px', color:'#666', fontSize:'13px', fontWeight:'600'}}>
                      {i === 0 ? 'Total' : isNum ? total.toLocaleString() : ''}
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
    </section>
  );
}

export default System;
