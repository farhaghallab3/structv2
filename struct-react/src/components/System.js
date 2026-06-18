import React, { useState } from 'react';
import { api } from '../services/api';

const KPI_CONFIG = {
  'CRM': [
    { label: 'Total Opportunities', field: 'Opportunity', type: 'count' },
    { label: 'Total Value', field: 'Value', type: 'sum' },
    { label: 'In Negotiation', field: 'Stage', type: 'filter', value: 'Negotiation' },
    { label: 'Owners', field: 'Owner', type: 'unique' },
  ],
  'Cost Management': [
    { label: 'Total Budget', field: 'Budget', type: 'sum' },
    { label: 'Total Actual', field: 'Actual', type: 'sum' },
    { label: 'Over Budget', field: 'Usage', type: 'over', threshold: '100%' },
    { label: 'Categories', field: 'Category', type: 'count' },
  ],
  'Cash Flow': [
    { label: 'Total Inflows', field: 'Inflows', type: 'sum' },
    { label: 'Total Outflows', field: 'Outflows', type: 'sum' },
    { label: 'Critical Periods', field: 'Status', type: 'filter', value: 'Critical' },
    { label: 'Periods', field: 'Period', type: 'count' },
  ],
  'Campaigns': [
    { label: 'Total Campaigns', field: 'Campaign', type: 'count' },
    { label: 'Total Budget', field: 'Budget', type: 'sum' },
    { label: 'Total Leads', field: 'Leads', type: 'sum' },
    { label: 'Active', field: 'Status', type: 'filter', value: 'Active' },
  ],
  'Meetings': [
    { label: 'Total Meetings', field: 'Meeting', type: 'count' },
    { label: 'Scheduled', field: 'Status', type: 'filter', value: 'Scheduled' },
    { label: 'Total Actions', field: 'Actions', type: 'sum' },
    { label: 'Pending Decisions', field: 'Decision', type: 'filter', value: 'Pending' },
  ],
  'Product': [
    { label: 'Total Items', field: 'Item', type: 'count' },
    { label: 'Active', field: 'Status', type: 'filter', value: 'Active' },
    { label: 'Bugs', field: 'Type', type: 'filter', value: 'Bug' },
    { label: 'High Priority', field: 'Priority', type: 'filter', value: 'High' },
  ],
};

const STATUS_COLORS = {
  'Active': '#22c55e', 'active': '#22c55e',
  'Done': '#22c55e', 'done': '#22c55e',
  'Healthy': '#22c55e', 'healthy': '#22c55e',
  'Review': '#f59e0b', 'review': '#f59e0b',
  'Watch': '#f59e0b', 'watch': '#f59e0b',
  'Pending': '#f59e0b', 'pending': '#f59e0b',
  'Open': '#f59e0b', 'open': '#f59e0b',
  'Scheduled': '#3b82f6', 'scheduled': '#3b82f6',
  'Critical': '#ef4444', 'critical': '#ef4444',
  'Approved': '#22c55e', 'approved': '#22c55e',
  'Inactive': '#6b7280', 'inactive': '#6b7280',
};

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
    return total > 999 ? `${(total/1000).toFixed(1)}K` : total.toLocaleString();
  }
  if (kpi.type === 'filter') return vals.filter(v => v === kpi.value).length;
  if (kpi.type === 'unique') return new Set(vals).size;
  if (kpi.type === 'over') return vals.filter(v => parseNum(v) > 100).length;
  return '—';
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
    { label: 'Total Records', field: headers[0], type: 'count' },
    { label: 'Unique Owners', field: headers[3] || headers[0], type: 'unique' },
  ];

  const statusCol = headers.findIndex(h => h.toLowerCase() === 'status');
  const statusValues = statusCol >= 0 ? [...new Set(rows.map(r => r[statusCol]).filter(Boolean))] : [];
  const filterOptions = ['All', ...statusValues];

  const filteredRows = rows.filter((row, idx) => {
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
        <input id="field_${h.replace(/\s/g,'_')}" style="width:100%;background:#0d0d0d;color:#fff;border:1px solid #2a2a2a;padding:10px 12px;border-radius:8px;font-size:14px;box-sizing:border-box" placeholder="${h}..." />
      </div>`
    ).join('');
    onOpenModal(
      'New Record',
      'Fill in the fields below.',
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
    <section id="system">
      <div className="back" onClick={onBack}>← Back to Systems</div>

      <div className="top">
        <div>
          <div className="eyebrow">{workspaceName || 'Workspace'}</div>
          <h1>{systemName}</h1>
          <div className="sub">Smart operating table — manage, track, and execute.</div>
        </div>
        <div className="actions">
          <button className="secondary" onClick={() => showToast('Share coming soon')}>Share</button>
          <button className="secondary" onClick={() => showToast('Reports coming soon')}>Reports</button>
          <button className="primary" onClick={openNewRecord}>+ New Record</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', margin:'24px 0'}}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{background:'#111', border:'1px solid #1f1f1f', borderRadius:'12px', padding:'20px'}}>
            <div style={{color:'#666', fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'8px'}}>{kpi.label}</div>
            <div style={{color:'#fff', fontSize:'28px', fontWeight:'700'}}>{calcKPI(rows, headers, kpi)}</div>
          </div>
        ))}
      </div>

      {/* Tables */}
      <section className="tables" style={{marginBottom:'24px'}}>
        {systemData.tables.map((table, idx) => (
          <div key={idx} className="card" onClick={() => showToast(`${table} selected`)}>
            <h3>{table}</h3>
            <div className="stats"><span className="tag">{idx === 0 ? 'Main table' : 'Connected table'}</span></div>
          </div>
        ))}
      </section>

      {/* Toolbar */}
      <div className="toolbar">
        <div>
          <span className="tool active">Table</span>
          <span className="tool" onClick={() => showToast('Board view coming soon')}>Board</span>
          <span className="tool" onClick={() => showToast('Reports coming soon')}>Reports</span>
          <span className="tool" onClick={() => showToast('AI coming soon')}>AI</span>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
          <input
            placeholder="Search..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            style={{background:'#111', color:'#fff', border:'1px solid #2a2a2a', padding:'6px 12px', borderRadius:'6px', fontSize:'13px', outline:'none'}}
          />
          <span className="tool" onClick={() => showToast('Columns coming soon')}>Columns</span>
          <span className="tool" onClick={() => showToast('Sort coming soon')}>Sort</span>
        </div>
      </div>

      {/* Filter Pills */}
      {statusValues.length > 0 && (
        <div style={{display:'flex', gap:'8px', margin:'12px 0', flexWrap:'wrap'}}>
          {filterOptions.map(opt => (
            <button key={opt} onClick={() => setActiveFilter(opt)}
              style={{background: activeFilter === opt ? '#fff' : '#111', color: activeFilter === opt ? '#000' : '#888',
                border:'1px solid #2a2a2a', padding:'4px 14px', borderRadius:'20px', fontSize:'13px', cursor:'pointer'}}>
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="tablebox">
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th style={{width:'36px'}}></th>
                {headers.map((h, i) => <th key={i}>{h}</th>)}
                <th style={{width:'40px'}}></th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  <td style={{textAlign:'center', color:'#555', cursor:'pointer', fontSize:'14px'}}
                    onClick={(e) => startEdit(e, rowIdx, 0, row[0])}>✎</td>
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} onClick={(e) => startEdit(e, rowIdx, cellIdx, cell)}
                      style={{cursor:'pointer'}}>
                      {editingCell?.rowIdx === rowIdx && editingCell?.cellIdx === cellIdx ? (
                        <input autoFocus value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={() => saveEdit(rowIdx, cellIdx)}
                          onKeyDown={e => handleKeyDown(e, rowIdx, cellIdx)}
                          onClick={e => e.stopPropagation()}
                          style={{background:'#1a1a2e', color:'#fff', border:'1px solid #555', padding:'4px 8px', borderRadius:'4px', width:'100%', fontSize:'inherit'}}
                        />
                      ) : (
                        STATUS_COLORS[cell] ? (
                          <span style={{background: STATUS_COLORS[cell] + '22', color: STATUS_COLORS[cell],
                            padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:'500'}}>
                            {cell}
                          </span>
                        ) : cell
                      )}
                    </td>
                  ))}
                  <td style={{textAlign:'center', position:'relative'}}>
                    <button onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === rowIdx ? null : rowIdx); }}
                      style={{background:'none', border:'none', color:'#666', cursor:'pointer', fontSize:'18px', padding:'0 8px'}}>⋮</button>
                    {openMenu === rowIdx && (
                      <div style={{position:'absolute', right:'8px', top:'100%', background:'#1a1a1a', border:'1px solid #2a2a2a',
                        borderRadius:'8px', zIndex:100, minWidth:'140px', overflow:'hidden'}}>
                        <div onClick={(e) => { startEdit(e, rowIdx, 0, row[0]); }}
                          style={{padding:'10px 16px', cursor:'pointer', color:'#fff', fontSize:'13px'}}
                          onMouseEnter={e => e.target.style.background='#2a2a2a'}
                          onMouseLeave={e => e.target.style.background='transparent'}>
                          ✎ Edit
                        </div>
                        <div onClick={() => handleDeleteRow(rowIdx)}
                          style={{padding:'10px 16px', cursor:'pointer', color:'#ef4444', fontSize:'13px'}}
                          onMouseEnter={e => e.target.style.background='#2a2a2a'}
                          onMouseLeave={e => e.target.style.background='transparent'}>
                          🗑 Delete
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default System;
