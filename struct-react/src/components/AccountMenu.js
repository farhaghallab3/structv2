import React from 'react';

function AccountMenu({ user, onLogout, onOpenModal, showToast, onClose }) {
  return (
    <div className="account-menu">
      <a onClick={() => {
        onOpenModal(
          'Profile',
          'Account settings.',
          `<div class="options">
            <div class="option"><h3>Name</h3><p>${user?.name || 'User'}</p></div>
            <div class="option"><h3>Email</h3><p>${user?.email || 'user@example.com'}</p></div>
            <div class="option"><h3>Password</h3><p>Change password</p></div>
          </div>`
        );
        onClose();
      }}>
        Profile
      </a>
      <a onClick={() => {
        onOpenModal(
          'Billing & Subscription',
          'Plan, invoices, usage, and payment method.',
          `<div class="options">
            <div class="option"><h3>Current Plan</h3><p>Pro Workspace · Active</p></div>
            <div class="option"><h3>Usage</h3><p>8 systems · 42 tables · 1.2GB storage</p></div>
            <div class="option"><h3>Invoices</h3><p>View billing history</p></div>
          </div>`
        );
        onClose();
      }}>
        Billing & Subscription
      </a>
      <a onClick={() => {
        onOpenModal(
          'Team Members',
          'Manage users and roles.',
          `<div class="suggestions">
            <div class="suggestion">Abdullah — Owner</div>
            <div class="suggestion">Sara — Editor</div>
            <div class="suggestion">Ahmed — Contributor</div>
            <div class="suggestion">+ Invite Member</div>
          </div>`
        );
        onClose();
      }}>
        Team Members
      </a>
      <a onClick={() => {
        onOpenModal(
          'Workspace Settings',
          'Configure workspace, security, and defaults.',
          `<div class="options">
            <div class="option"><h3>General</h3><p>Name, logo, timezone.</p></div>
            <div class="option"><h3>Security</h3><p>Roles, audit, access defaults.</p></div>
            <div class="option"><h3>Defaults</h3><p>Statuses, fields, views.</p></div>
          </div>`
        );
        onClose();
      }}>
        Workspace Settings
      </a>
      <a onClick={onLogout}>
        Logout
      </a>
    </div>
  );
}

export default AccountMenu;
