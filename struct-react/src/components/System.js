import React, { useState } from 'react';

function System({ systemName, systemData, workspaceName, onBack, onOpenModal, onShowDrawer, showToast }) {
  const [activeRecord, setActiveRecord] = useState(null);

  const handleRecordClick = (row) => {
    setActiveRecord(row);
    const drawerHTML = `<div class="modal-head">
      <div>
        <h2>${row[0]}</h2>
        <div class="sub">Record Drawer</div>
      </div>
      <button class="close">Close</button>
    </div>
    <div class="mini">
      <div><span>Status</span><strong>${row[2] || 'Open'}</strong></div>
      <div><span>Owner</span><strong>${row[3] || row[5] || 'Team'}</strong></div>
      <div><span>Evidence</span><strong>2 files</strong></div>
      <div><span>AI</span><strong>2 insights</strong></div>
    </div>
    <div class="drawer-section">
      <h3>Execution</h3>
      <div class="suggestion">Update status, assign owner, add checklist, attach evidence, and comment.</div>
    </div>
    <div class="drawer-section">
      <h3>AI Suggestions</h3>
      <div class="suggestion">Summarize this record</div>
      <div class="suggestion">Suggest next action</div>
    </div>
    <div class="drawer-section">
      <h3>Activity</h3>
      <div class="suggestion">Owner updated record 2 hours ago</div>
    </div>`;
    
    onShowDrawer(drawerHTML);
  };

  return (
    <section id="system">
      <div className="back" onClick={onBack}>← Back to Systems</div>
      <div className="top">
        <div>
          <div className="eyebrow">{workspaceName || 'Workspace'}</div>
          <h1>{systemName}</h1>
          <div className="sub">Connected smart tables. Choose a table or continue from the main table.</div>
        </div>
        <div className="actions">
          <button 
            className="secondary" 
            onClick={() => onOpenModal(
              'Share Access',
              'Workspace → System → Table → Record',
              `<div class="options">
                <div class="option"><h3>Invite Email</h3><p>name@company.com</p></div>
                <div class="option"><h3>Scope</h3><p>This System</p></div>
                <div class="option"><h3>Role</h3><p>Contributor</p></div>
              </div>`
            )}
          >
            Share
          </button>
          <button 
            className="secondary"
            onClick={() => onOpenModal(
              'Automations',
              'Rules, triggers, actions, and logs.',
              `<div class="suggestions">
                <div class="suggestion">Budget usage > 100% → Create alert + approval</div>
                <div class="suggestion">Approval pending 3 days → Notify owner</div>
                <div class="suggestion">Receipt missing → Request evidence</div>
                <div class="suggestion">+ New Rule</div>
              </div>`
            )}
          >
            Automations
          </button>
          <button 
            className="secondary"
            onClick={() => onOpenModal(
              'Reports',
              'Generated from selected system data.',
              `<div class="grid3">
                ${['Monthly Summary', 'Budget Variance', 'Vendor Spend', 'Approval Aging', 'AI Executive Brief', 'Export PDF']
                  .map(r => `<div class="option"><h3>${r}</h3><p>Saved report view.</p></div>`)
                  .join('')}
              </div>`
            )}
          >
            Reports
          </button>
          <button 
            className="primary"
            onClick={() => onOpenModal(
              'New Record',
              'Create a new row in the selected table.',
              `<div class="options">
                <div class="option"><h3>Title</h3><p>New record title</p></div>
                <div class="option"><h3>Owner</h3><p>Assign owner</p></div>
                <div class="option"><h3>Create</h3><p>Save new record</p></div>
              </div>`
            )}
          >
            + New Record
          </button>
        </div>
      </div>

      <section className="tables">
        {systemData.tables.map((table, idx) => (
          <div key={idx} className="card" onClick={() => showToast(`${table} selected`)}>
            <h3>{table}</h3>
            <div className="stats">
              <span className="tag">{idx === 0 ? 'Main table' : 'Connected table'}</span>
            </div>
          </div>
        ))}
      </section>

      <div className="toolbar">
        <div>
          <span className="tool active">Table</span>
          <span className="tool" onClick={() => showToast('Board view placeholder')}>Board</span>
          <span 
            className="tool" 
            onClick={() => onOpenModal(
              'Reports',
              'Generated from selected system data.',
              `<div class="grid3">
                ${['Monthly Summary', 'Budget Variance', 'Vendor Spend', 'Approval Aging', 'AI Executive Brief', 'Export PDF']
                  .map(r => `<div class="option"><h3>${r}</h3><p>Saved report view.</p></div>`)
                  .join('')}
              </div>`
            )}
          >
            Reports
          </span>
          <span 
            className="tool" 
            onClick={() => onOpenModal(
              'Ask Struct',
              'Search, summarize, or create.',
              `<input class="searchbox" value="What needs my attention today?">
               <div class="suggestions">
                <div class="suggestion">Summarize this workspace</div>
                <div class="suggestion">Open overdue records</div>
                <div class="suggestion">Create a new system</div>
              </div>`
            )}
          >
            AI
          </span>
        </div>
        <div>
          <span className="tool" onClick={() => showToast('Filter placeholder')}>Filter</span>
          <span className="tool" onClick={() => showToast('Columns placeholder')}>Columns</span>
          <span className="tool" onClick={() => showToast('Sort placeholder')}>Sort</span>
        </div>
      </div>

      <div className="tablebox">
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                {systemData.headers.map((header, idx) => (
                  <th key={idx}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {systemData.rows.map((row, rowIdx) => (
                <tr key={rowIdx} onClick={() => handleRecordClick(row)}>
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx}>{cell}</td>
                  ))}
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
