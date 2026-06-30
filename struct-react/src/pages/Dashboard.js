import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Home from '../components/Home';
import System from '../components/System';
import Inbox from '../components/Inbox';
import Modal from '../components/Modal';
import Drawer from '../components/Drawer';
import Toast from '../components/Toast';
import AccountMenu from '../components/AccountMenu';
import InviteMembers from '../components/InviteMembers';
import { api, buildSystemList, buildSystemsMap } from '../services/api';

function Dashboard({ user, onLogout }) {
  const { systemName: urlSystem } = useParams();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState(urlSystem ? 'system' : 'home');
  const [selectedSystem, setSelectedSystem] = useState(urlSystem ? decodeURIComponent(urlSystem) : null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerContent, setDrawerContent] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState(null);
  const [systemList, setSystemList] = useState([]);
  const [systems, setSystems] = useState({});
  const [templates, setTemplates] = useState([]);
  const [activities, setActivities] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 1800);
  };

  const loadDashboard = useCallback(async () => {
    try {
      const data = await api.getDashboard();
      setWorkspace(data.workspace);
      setSystemList(buildSystemList(data.systems));
      setSystems(buildSystemsMap(data.systems));
      setTemplates(data.templates || []);
      setActivities(data.activities || []);
    } catch (err) {
      showToast(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await api.getUnreadCount();
        setUnreadCount(data.count || 0);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const openSystem = (name) => {
    setShowInvite(false);
    setSelectedSystem(name);
    setCurrentView('system');
    navigate(`/s/${encodeURIComponent(name)}`);
    setSidebarOpen(false);
  };

  const goHome = () => {
    setCurrentView('home');
    navigate('/');
  };

  const openModal = (title, subtitle, body, small = false) => {
    setSidebarOpen(false);
    if (body === '__INVITE__') { setShowInvite(true); return; }
    if (body === '__CREATE__') { setShowCreate(true); return; }
    setModalContent({ title, subtitle, body, small });
    setShowModal(true);
    setShowAccountMenu(false);
  };

  const handleInstallTemplate = async (templateName) => {
    if (!workspace) return;
    try {
      await api.installTemplate(workspace.id, templateName);
      showToast(`${templateName} installed`);
      closeModal();
      setLoading(true);
      await loadDashboard();
      openSystem(templateName);
    } catch (err) {
      showToast(err.message || 'Install failed');
    }
  };

  const handleCreateBlankSystem = async (name) => {
    if (!workspace || !name) return;
    try {
      await api.createSystem(workspace.id, name);
      showToast(`${name} created`);
      closeModal();
      setLoading(true);
      await loadDashboard();
      openSystem(name);
    } catch (err) {
      showToast(err.message || 'Create failed');
    }
  };

  window._createBlank = handleCreateBlankSystem;

  const openTemplatesGallery = () => {
    closeModal();
    setTimeout(() => {
      const installed = new Set(Object.keys(systems));
      const available = templates.filter((t) => !installed.has(t.name));
      const list = available.length > 0 ? available : templates;
      const body = `<div class="grid3">${list.map((t) => `<div class="option template-install" data-template="${t.name}"><h3>${t.name}</h3><p>${t.description || 'Ready tables, fields, reports, and AI actions.'}</p></div>`).join('')}</div>`;
      openModal('Template Gallery', 'Choose a ready operating table.', body);
    }, 100);
  };

  const closeModal = () => setShowModal(false);
  const closeDrawer = () => setShowDrawer(false);

  const handleLogoutClick = () => {
    showToast('Logged out');
    setTimeout(() => onLogout(), 500);
  };

  if (loading) {
    return <div className="auth-container"><div className="auth-form">Loading workspace...</div></div>;
  }

  const activeSystemData = selectedSystem ? systems[selectedSystem] : null;

  return (
    <div className="shell">
      <div className="mobile-bar">
        <div className="logo">STRUCT</div>
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>☰</button>
      </div>
      <div className={`sidebar-overlay ${sidebarOpen ? 'is-open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggleAccountMenu={() => setShowAccountMenu(!showAccountMenu)}
        onNavigate={(view) => { setCurrentView(view); setShowAccountMenu(false); setSidebarOpen(false); if (view === 'home') navigate('/'); }}
        onShowModal={openModal}
        onOpenTemplates={openTemplatesGallery}
        showToast={showToast}
        systemList={systemList}
        onOpenSystem={openSystem}
        onLogout={handleLogoutClick}
        unreadCount={unreadCount}
      />

      <main className="main">
        {currentView === 'home' && (
          <Home activities={activities} systemList={systemList}
            onOpenSystem={openSystem} onOpenModal={openModal}
            showToast={showToast} onOpenTemplates={openTemplatesGallery}
          />
        )}

        {currentView === 'inbox' && (
          <Inbox showToast={showToast} onUnreadCountChange={setUnreadCount} />
        )}

        {currentView === 'system' && activeSystemData && (
          <System key={selectedSystem} systemName={selectedSystem} systemData={activeSystemData}
            workspaceName={workspace?.name} onBack={goHome}
            onOpenModal={openModal}
            onShowDrawer={(content) => { setDrawerContent(content); setShowDrawer(true); }}
            showToast={showToast}
            onRefresh={loadDashboard}
          />
        )}

        {currentView === 'system' && !activeSystemData && !loading && (
          <section id="system">
            <div className="back" onClick={goHome}>← Back to Systems</div>
            <h1>System not found</h1>
            <div className="sub">This system may have been deleted or doesn't exist.</div>
            <button className="primary" onClick={goHome} style={{ marginTop: 16 }}>Back to Systems</button>
          </section>
        )}
      </main>

      {showAccountMenu && (
        <AccountMenu user={user} onLogout={handleLogoutClick} onOpenModal={openModal} showToast={showToast} onClose={() => setShowAccountMenu(false)} />
      )}

      {showModal && (
        <Modal content={modalContent} onClose={closeModal} onOpenModal={openModal}
          showToast={showToast} onOpenTemplates={openTemplatesGallery} onInstallTemplate={handleInstallTemplate} />
      )}

      {showInvite && (
        <div className="overlay" onClick={() => setShowInvite(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:'560px'}}>
            <div className="modal-head">
              <div>
                <h2>Share Workspace</h2>
                <div className="sub">Invite people to collaborate</div>
              </div>
              <button className="close" onClick={() => setShowInvite(false)}>Close</button>
            </div>
            <InviteMembers workspace={workspace} systemName={selectedSystem} systemId={activeSystemData?.id} showToast={showToast} onClose={() => setShowInvite(false)} />
          </div>
        </div>
      )}

      {showDrawer && <Drawer content={drawerContent} onClose={closeDrawer} />}
      {toastMessage && <Toast message={toastMessage} />}
 
  {showCreate && (
        <div className="overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{maxWidth:'560px'}}>
            <div className="modal-head">
              <div><h2>Create System</h2><div className="sub">Choose how to start</div></div>
              <button className="close" onClick={() => setShowCreate(false)}>Close</button>
            </div>
            <div style={{padding:'8px 0', display:'grid', gap:'12px'}}>
              <div onClick={() => {
                  setShowCreate(false);
                  const name = prompt('System name:');
                  if (name) handleCreateBlankSystem(name);
                }}
                style={{background:'#0d0d0d', border:'1px solid #2a2a2a', borderRadius:'12px', padding:'20px', cursor:'pointer'}}
                onMouseEnter={e => e.currentTarget.style.borderColor='#444'}
                onMouseLeave={e => e.currentTarget.style.borderColor='#2a2a2a'}>
                <div style={{color:'#fff', fontWeight:'600', marginBottom:'6px'}}>○ Blank System</div>
                <div style={{color:'#555', fontSize:'13px'}}>Start with an empty table and build your own columns</div>
              </div>
              <div onClick={() => { setShowCreate(false); openTemplatesGallery(); }}
                style={{background:'#0d0d0d', border:'1px solid #2a2a2a', borderRadius:'12px', padding:'20px', cursor:'pointer'}}
                onMouseEnter={e => e.currentTarget.style.borderColor='#444'}
                onMouseLeave={e => e.currentTarget.style.borderColor='#2a2a2a'}>
                <div style={{color:'#fff', fontWeight:'600', marginBottom:'6px'}}>≡ From Template</div>
                <div style={{color:'#555', fontSize:'13px'}}>CRM, Cash Flow, Campaigns, Meetings, and more</div>
              </div>
              <div onClick={() => { setShowCreate(false); const name = prompt('System name:'); if(name) { handleCreateBlankSystem(name); } }}
                style={{background:'#0d0d0d', border:'1px solid #2a2a2a', borderRadius:'12px', padding:'20px', cursor:'pointer'}}
                onMouseEnter={e => e.currentTarget.style.borderColor='#444'}
                onMouseLeave={e => e.currentTarget.style.borderColor='#2a2a2a'}>
                <div style={{color:'#fff', fontWeight:'600', marginBottom:'6px'}}>⚙️+Custom</div>
                <div style={{color:'#555', fontSize:'13px'}}>Name your system and configure columns yourself from scratch</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
