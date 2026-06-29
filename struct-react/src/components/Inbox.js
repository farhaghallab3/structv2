import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

function timeAgo(dateStr) {
  const normalized = String(dateStr).replace(' ', 'T').replace('+00:00', 'Z').replace(/\.\d+Z$/, 'Z');
  const diff = Math.floor((Date.now() - new Date(normalized).getTime()) / 1000);
  if (isNaN(diff) || diff < 0) return 'Just now';
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const TYPE_ICON = {
  inbox: '✉',
  alert: '⚠️',
  mention: '@',
};

function Inbox({ showToast, onUnreadCountChange }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all'); // 'all' | 'unread'

  const load = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      const list = Array.isArray(data) ? data : (data.results || []);
      setNotifications(list);
      const unread = list.filter(n => !n.is_read).length;
      if (onUnreadCountChange) onUnreadCountChange(unread);
    } catch (err) {
      showToast('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [showToast, onUnreadCountChange]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkRead = async (n) => {
    if (n.is_read) return;
    try {
      await api.markNotificationRead(n.id);
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
      if (onUnreadCountChange) {
        onUnreadCountChange(prev => Math.max(0, prev - 1));
      }
    } catch { }
  };

  const handleMarkAll = async () => {
    try {
      await api.markAllRead();
      setNotifications(prev => prev.map(x => ({ ...x, is_read: true })));
      if (onUnreadCountChange) onUnreadCountChange(0);
      showToast('All notifications marked as read');
    } catch {
      showToast('Failed to mark all as read');
    }
  };

  const visible = tab === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <section className="inbox-page">
      <div className="inbox-header">
        <div>
          <h1 className="inbox-title">Inbox</h1>
          <p className="inbox-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="inbox-mark-all-btn" onClick={handleMarkAll}>
            Mark all as read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="inbox-tabs">
        <button
          className={`inbox-tab ${tab === 'all' ? 'active' : ''}`}
          onClick={() => setTab('all')}
        >
          All
          <span className="inbox-tab-count">{notifications.length}</span>
        </button>
        <button
          className={`inbox-tab ${tab === 'unread' ? 'active' : ''}`}
          onClick={() => setTab('unread')}
        >
          Unread
          {unreadCount > 0 && (
            <span className="inbox-tab-count unread">{unreadCount}</span>
          )}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="inbox-empty">Loading...</div>
      ) : visible.length === 0 ? (
        <div className="inbox-empty">
          <div className="inbox-empty-icon"></div>
          <div className="inbox-empty-text">
            {tab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </div>
          <div className="inbox-empty-sub">
            {tab === 'unread' ? 'Switch to "All" to see past notifications.' : 'Notifications will appear here when you add records or create systems.'}
          </div>
        </div>
      ) : (
        <div className="inbox-list">
          {visible.map(n => (
            <div
              key={n.id}
              className={`notif-item ${n.is_read ? 'read' : 'unread'}`}
              onClick={() => handleMarkRead(n)}
            >
              <div className="notif-icon">
                {TYPE_ICON[n.notification_type] || '·'}
              </div>
              <div className="notif-body">
                <div className="notif-title">{n.title}</div>
                <div className="notif-message">{n.message}</div>
                <div className="notif-time">{timeAgo(n.created_at)}</div>
              </div>
              {!n.is_read && <div className="notif-dot" />}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Inbox;
