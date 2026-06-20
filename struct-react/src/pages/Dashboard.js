import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import Home from '../components/Home';
import System from '../components/System';
import Modal from '../components/Modal';
import Drawer from '../components/Drawer';
import Toast from '../components/Toast';
import AccountMenu from '../components/AccountMenu';
import { api, buildSystemList, buildSystemsMap } from '../services/api';

function Dashboard({ user, onLogout }) {
  const [currentView, setCurrentView] = useState('home');
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerContent, setDrawerContent] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState(null);
  const [systemList, setSystemList] = useState([]);
  const [systems, setSystems] = useState({});
  const [templates, setTemplates] = useState([]);
  const [activities, setActivities] = useState([]);

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
      setSelectedSystem((prev) => prev || (data.systems.length > 0 ? data.systems[0].name : null));
    } catch (err) {
      showToast(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const openModal = (title, subtitle, body, small = false) => {
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
      setSelectedSystem(templateName);
      setCurrentView('system');
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
    setSelectedSystem(name);
    setCurrentView('system');
  } catch (err) {
    showToast(err.message || 'Create failed');
  }
};

  const openTemplatesGallery = () => {
    closeModal();
    setTimeout(() => {
      const installed = new Set(Object.keys(systems));
      const available = templates.filter((t) => !installed.has(t.name));
      const list = available.length > 0 ? available : templates;

      const body = `<div class="grid3">${list
        .map((t) => `<div class="option template-install" data-template="${t.name}"><h3>${t.name}</h3><p>${t.description || 'Ready tables, fields, reports, and AI actions.'}</p></div>`)
        .join('')}</div>`;
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
    return (
      <div className="auth-container">
        <div className="auth-form">Loading workspace...</div>
      </div>
    );
  }

  const activeSystemData = selectedSystem ? systems[selectedSystem] : null;

  return (
    <div className="shell">
      <Sidebar 
        onToggleAccountMenu={() => setShowAccountMenu(!showAccountMenu)}
        onNavigate={(view) => {
          setCurrentView(view);
          setShowAccountMenu(false);
        }}
        onShowModal={openModal}
        onOpenTemplates={openTemplatesGallery}
        showToast={showToast}
        systemList={systemList}
        onOpenSystem={(name) => {
          setSelectedSystem(name);
          setCurrentView('system');
        }}
        onLogout={handleLogoutClick}
      />

      <main className="main">
        {currentView === 'home' && (
          <Home 
            activities={activities}
            systemList={systemList}
            onOpenSystem={(name) => {
              setSelectedSystem(name);
              setCurrentView('system');
            }}
            onOpenModal={openModal}
            showToast={showToast}
            onOpenTemplates={openTemplatesGallery}
          />
        )}

        {currentView === 'system' && activeSystemData && (
          <System 
            key={selectedSystem}
            systemName={selectedSystem}
            systemData={activeSystemData}
            workspaceName={workspace?.name}
            onBack={() => setCurrentView('home')}
            onOpenModal={openModal}
            onShowDrawer={(content) => {
              setDrawerContent(content);
              setShowDrawer(true);
            }}
            showToast={showToast}
          />
        )}

        {currentView === 'system' && !activeSystemData && (
          <section id="system">
            <div className="back" onClick={() => setCurrentView('home')}>← Back to Systems</div>
            <h1>No systems yet</h1>
            <div className="sub">Install a template from the gallery to get started.</div>
            <button className="primary" onClick={openTemplatesGallery} style={{ marginTop: 16 }}>
              Open Template Gallery
            </button>
          </section>
        )}
      </main>

      {showAccountMenu && (
        <AccountMenu 
          user={user}
          onLogout={handleLogoutClick}
          onOpenModal={openModal}
          showToast={showToast}
          onClose={() => setShowAccountMenu(false)}
        />
      )}

      {showModal && (
        <Modal 
          content={modalContent}
          onClose={closeModal}
          onOpenModal={openModal}
          showToast={showToast}
          onOpenTemplates={openTemplatesGallery}
          onInstallTemplate={handleInstallTemplate}
        />
      )}

      {showDrawer && (
        <Drawer 
          content={drawerContent}
          onClose={closeDrawer}
        />
      )}

      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
}

export default Dashboard;
