import React from 'react';

function Sidebar({ onToggleAccountMenu, onNavigate, onShowModal, onOpenTemplates, showToast, systemList, onOpenSystem, onLogout, isOpen, onClose }) {
  const openCreateModal = () => {
    onShowModal(
      'Create',
      'Start with a blank smart table, a template, or AI.',
      `<div class="options">
        <div class="option" onclick="alert('Blank Smart Table created')">
          <h3>Blank Smart Table</h3>
          <p>Define columns, statuses, owners, and rules manually.</p>
        </div>
        <div class="option" data-action="use-template" style="cursor: pointer;">
          <h3>Use Template</h3>
          <p>Install CRM, Cost, Campaigns, Meetings, VSM, Cash Flow, and more.</p>
        </div>
        <div class="option" onclick="alert('AI Builder placeholder')">
          <h3>Build with AI</h3>
          <p>Describe your work and Struct builds fields, rows, reports, and logic.</p>
        </div>
      </div>`,
      false,
      onOpenTemplates
    );
  };

  return (
    <aside className={`side ${isOpen ? 'is-open' : ''}`}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'28px'}}>
        <div className="logo" style={{margin:0}}>STRUCT</div>
        {onClose && (
          <button onClick={onClose}
            style={{background:'transparent', border:'none', color:'#666', fontSize:'20px', cursor:'pointer', padding:'4px 8px', lineHeight:'1'}}>
            ✕
          </button>
        )}
      </div>

      <nav className="nav">
        <a 
          className="active" 
          onClick={() => onNavigate('home')}
        >
          Systems
        </a>
        <a 
          className="nav-create"
          onClick={openCreateModal}
        >
          + Create System
        </a>
      </nav>

      <div style={{ borderTop: '1px solid var(--line)', margin: '16px 0' }}></div>

      <div style={{ paddingBottom: '16px' }}>
        <small style={{ display: 'block', color: 'var(--muted2)', letterSpacing: '1.5px', textTransform: 'uppercase', fontSize: '11px', marginBottom: '8px' }}>
          Systems List
        </small>
        <div style={{ display: 'grid', gap: '6px' }}>
          {systemList && systemList.map((system, idx) => (
            <a 
              key={idx}
              onClick={() => {
                onOpenSystem(system[0]);
                onNavigate('system');
              }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '10px',
                color: 'var(--muted)',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'var(--surface2)';
                e.target.style.color = 'var(--text)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'var(--muted)';
              }}
            >
              <span>{system[0]}</span>
              <span style={{ fontSize: '11px', color: 'var(--muted2)' }}>{system[4]}</span>
            </a>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--line)', margin: '16px 0' }}></div>

      <nav className="nav" style={{ marginTop: '0' }}>
        <small style={{ margin: '0 0 8px' }}>Account</small>
        <a onClick={() => showToast('Inbox')}>
           Inbox
        </a>
        <a onClick={() => onShowModal(
          'Templates',
          'Browse system templates.',
          `<div class="grid3">
            ${['CRM', 'Cost Management', 'Cash Flow', 'Campaigns', 'Meetings', 'Product']
              .map(t => `<div class="option" onclick="alert('${t} template')"><h3>${t}</h3><p>Ready-to-use template</p></div>`)
              .join('')}
          </div>`
        )}>
           Templates
        </a>
        <a onClick={() => onShowModal(
          'Workspace Settings',
          'Configure workspace, security, and defaults.',
          `<div class="options">
            <div class="option"><h3>General</h3><p>Name, logo, timezone.</p></div>
            <div class="option"><h3>Security</h3><p>Roles, audit, access defaults.</p></div>
            <div class="option"><h3>Defaults</h3><p>Statuses, fields, views.</p></div>
          </div>`
        )}>
           Settings
        </a>
        <a onClick={onLogout} style={{ color: 'var(--red)' }}>
           Logout
        </a>
      </nav>
    </aside>
  );
}

export default Sidebar;
