import React from 'react';

function Home({ systemList, onOpenSystem, onOpenModal, showToast, onOpenTemplates }) {
  return (
    <section id="home">
      <div className="top">
        <div>
          <div className="eyebrow">Structishen Workspace</div>
          <h1>Systems</h1>
          <div className="sub">Smart operating tables for organizing, governing, and executing work.</div>
        </div>
        <div className="actions">
          <button 
            className="secondary" 
            onClick={() => showToast('Switch Workspace')}
          >
            Switch Workspace
          </button>
          <button 
            className="primary"
            onClick={() => onOpenModal(
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
              </div>`
            )}
          >
            + Create
          </button>
        </div>
      </div>

      <div 
        className="command" 
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
        <span><b>Ask Struct</b> — search records, summarize work, or create a system...</span>
        <span>⌘ K</span>
      </div>

      <section className="attention">
        <div className="att" onClick={() => onOpenModal(
          'Needs Attention',
          'Actionable records across workspace.',
          `<div class="suggestions">
            <div class="suggestion">CRM: 3 overdue follow-ups</div>
            <div class="suggestion">Cost Management: 2 budgets over limit</div>
            <div class="suggestion">Meetings: 1 approval pending</div>
          </div>`
        )}>
          <i className="dot red"></i>
          <div>
            <strong>3 Overdue</strong>
            <span>Execution items need action.</span>
          </div>
        </div>

        <div className="att" onClick={() => onOpenModal(
          'Needs Attention',
          'Actionable records across workspace.',
          `<div class="suggestions">
            <div class="suggestion">CRM: 3 overdue follow-ups</div>
            <div class="suggestion">Cost Management: 2 budgets over limit</div>
            <div class="suggestion">Meetings: 1 approval pending</div>
          </div>`
        )}>
          <i className="dot amber"></i>
          <div>
            <strong>2 Approvals Pending</strong>
            <span>Waiting for decisions.</span>
          </div>
        </div>

        <div className="att" onClick={() => onOpenModal(
          'Needs Attention',
          'Actionable records across workspace.',
          `<div class="suggestions">
            <div class="suggestion">CRM: 3 overdue follow-ups</div>
            <div class="suggestion">Cost Management: 2 budgets over limit</div>
            <div class="suggestion">Meetings: 1 approval pending</div>
          </div>`
        )}>
          <i className="dot"></i>
          <div>
            <strong>1 Review Required</strong>
            <span>Budget variance detected.</span>
          </div>
        </div>
      </section>

      <div className="section-head">
        <div>
          <h2>Operating Systems</h2>
          <p>Open a system to work from its smart table.</p>
        </div>
      </div>

      <section className="systems">
        {systemList.map((system, idx) => (
          <div 
            key={idx}
            className="card" 
            onClick={() => onOpenSystem(system[0])}
          >
            <h3>{system[0]}</h3>
            <div className="stats">
              <span className="tag">{system[1]}</span>
              <span className="tag">{system[2]}</span>
              <span className="tag">{system[3]}</span>
            </div>
            <div className="big">{system[4]}</div>
          </div>
        ))}
      </section>

      <div className="section-head">
        <div>
          <h2>Recent Work</h2>
          <p>Last touched records across systems.</p>
        </div>
      </div>

      <section className="recent">
        <div className="row" onClick={() => onOpenSystem('CRM')}>
          <strong>CRM → شركة شيدز</strong>
          <span>2h ago</span>
        </div>
        <div className="row" onClick={() => onOpenSystem('Cost Management')}>
          <strong>Cost Management → Google Workspace</strong>
          <span>4h ago</span>
        </div>
        <div className="row" onClick={() => onOpenSystem('Meetings')}>
          <strong>Meetings → Board Meeting</strong>
          <span>Yesterday</span>
        </div>
      </section>
    </section>
  );
}

export default Home;
