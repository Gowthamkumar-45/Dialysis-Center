import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, Trash2, RefreshCcw, Filter,
  AlertTriangle, AlertCircle, Info, CheckCircle2,
  Package, Users, UserSquare2, Monitor, Stethoscope,
  CalendarCheck, Receipt, ClipboardCheck, Settings, X,
} from 'lucide-react';
import { notificationService } from '../../services/api';
import './Notifications.css';

const SEVERITY_META = {
  info:     { label: 'Info',     Icon: Info,          tone: 'info' },
  success:  { label: 'Success',  Icon: CheckCircle2,  tone: 'success' },
  warning:  { label: 'Warning',  Icon: AlertTriangle, tone: 'warning' },
  critical: { label: 'Critical', Icon: AlertCircle,   tone: 'critical' },
};

const CATEGORY_META = {
  patient:     { label: 'Patient',     Icon: Users },
  staff:       { label: 'Staff',       Icon: UserSquare2 },
  machine:     { label: 'Machine',     Icon: Monitor },
  session:     { label: 'Session',     Icon: Stethoscope },
  appointment: { label: 'Appointment', Icon: CalendarCheck },
  inventory:   { label: 'Inventory',   Icon: Package },
  billing:     { label: 'Billing',     Icon: Receipt },
  attendance:  { label: 'Attendance',  Icon: ClipboardCheck },
  system:      { label: 'System',      Icon: Settings },
};

const SEVERITY_FILTERS = ['All', 'critical', 'warning', 'success', 'info'];
const CATEGORY_FILTERS = ['All', 'patient', 'staff', 'machine', 'session', 'appointment', 'inventory', 'billing', 'attendance', 'system'];

const fullTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString('en-US', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
      })
    : '';

const relativeTime = (iso) => {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return `${Math.max(diff, 1)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return fullTime(iso);
};

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readFilter, setReadFilter] = useState('all'); // all | unread | read
  const [severity, setSeverity] = useState('All');
  const [category, setCategory] = useState('All');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { limit: 200 };
      if (readFilter === 'unread') params.unread = 1;
      if (severity !== 'All') params.severity = severity;
      if (category !== 'All') params.category = category;
      const { data } = await notificationService.getAll(params);
      let items = data || [];
      if (readFilter === 'read') items = items.filter((n) => n.is_read);
      setNotifications(items);
    } catch (err) {
      console.error('Notifications fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [readFilter, severity, category]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const counts = useMemo(() => ({
    total: notifications.length,
    unread: notifications.filter((n) => !n.is_read).length,
    critical: notifications.filter((n) => n.severity === 'critical').length,
    warning: notifications.filter((n) => n.severity === 'warning').length,
  }), [notifications]);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) { console.error(err); }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Permanently delete all notifications?')) return;
    try {
      await notificationService.clearAll();
      setNotifications([]);
    } catch (err) { console.error(err); }
  };

  const handleNavigate = (n) => {
    if (!n.is_read) handleMarkRead(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="notif-page">
      {/* Header */}
      <header className="notif-page-header">
        <div className="notif-hero">
          <div className="notif-hero-ico">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="notif-hero-title">Notifications</h2>
            <p className="notif-hero-sub">
              Stay on top of low stock, overdue bills, critical sessions, and system events.
            </p>
          </div>
        </div>
        <div className="notif-page-actions">
          <button className="notif-btn notif-btn-ghost" onClick={fetchData}>
            <RefreshCcw size={16} /> Refresh
          </button>
          {counts.unread > 0 && (
            <button className="notif-btn notif-btn-primary" onClick={handleMarkAllRead}>
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
          {counts.total > 0 && (
            <button className="notif-btn notif-btn-danger" onClick={handleClearAll}>
              <Trash2 size={16} /> Clear all
            </button>
          )}
        </div>
      </header>

      {/* Stats */}
      <section className="notif-stats">
        <StatCard label="Total" value={counts.total} tone="total" Icon={Bell} />
        <StatCard label="Unread" value={counts.unread} tone="unread" Icon={AlertCircle} />
        <StatCard label="Critical" value={counts.critical} tone="critical" Icon={AlertCircle} />
        <StatCard label="Warnings" value={counts.warning} tone="warning" Icon={AlertTriangle} />
      </section>

      {/* Filters */}
      <section className="notif-filter-bar">
        <div className="notif-filter-group">
          <Filter size={14} className="notif-filter-ico" />
          <span className="notif-filter-label">Status</span>
          {['all', 'unread', 'read'].map((opt) => (
            <button
              key={opt}
              className={`notif-pill ${readFilter === opt ? 'active' : ''}`}
              onClick={() => setReadFilter(opt)}
            >
              {opt === 'all' ? 'All' : opt === 'unread' ? 'Unread' : 'Read'}
            </button>
          ))}
        </div>
        <div className="notif-filter-group">
          <span className="notif-filter-label">Severity</span>
          <select className="notif-select" value={severity} onChange={(e) => setSeverity(e.target.value)}>
            {SEVERITY_FILTERS.map((s) => (
              <option key={s} value={s}>{s === 'All' ? 'All severities' : SEVERITY_META[s]?.label}</option>
            ))}
          </select>
        </div>
        <div className="notif-filter-group">
          <span className="notif-filter-label">Module</span>
          <select className="notif-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORY_FILTERS.map((c) => (
              <option key={c} value={c}>{c === 'All' ? 'All modules' : CATEGORY_META[c]?.label}</option>
            ))}
          </select>
        </div>
      </section>

      {/* List */}
      <section className="notif-list-wrap">
        {loading ? (
          <div className="notif-page-empty">Loading…</div>
        ) : notifications.length === 0 ? (
          <div className="notif-page-empty">
            <Bell size={32} />
            <h3>No notifications</h3>
            <p>When something needs your attention, it'll appear here.</p>
          </div>
        ) : (
          <div className="notif-list">
            {notifications.map((n) => {
              const meta = SEVERITY_META[n.severity] || SEVERITY_META.info;
              const catMeta = CATEGORY_META[n.category] || CATEGORY_META.system;
              const SeverityIcon = meta.Icon;
              const CatIcon = catMeta.Icon;
              return (
                <article
                  key={n.id}
                  className={`notif-row tone-${meta.tone} ${!n.is_read ? 'unread' : ''}`}
                  onClick={() => handleNavigate(n)}
                >
                  <div className={`notif-row-ico tone-${meta.tone}`}>
                    <SeverityIcon size={18} />
                  </div>
                  <div className="notif-row-body">
                    <div className="notif-row-top">
                      <span className="notif-row-title">{n.title}</span>
                      <span className={`notif-row-sev tone-${meta.tone}`}>{meta.label}</span>
                      <span className="notif-row-cat">
                        <CatIcon size={11} /> {catMeta.label}
                      </span>
                    </div>
                    <p className="notif-row-msg">{n.message}</p>
                    <span className="notif-row-time" title={fullTime(n.created_at)}>
                      {relativeTime(n.created_at)} · {fullTime(n.created_at)}
                    </span>
                  </div>
                  <div className="notif-row-actions" onClick={(e) => e.stopPropagation()}>
                    {!n.is_read && (
                      <button
                        className="notif-icon-btn"
                        onClick={() => handleMarkRead(n.id)}
                        title="Mark as read"
                      >
                        <CheckCheck size={14} />
                      </button>
                    )}
                    <button
                      className="notif-icon-btn danger"
                      onClick={() => handleDelete(n.id)}
                      title="Delete"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {!n.is_read && <span className="notif-row-dot" />}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

const StatCard = ({ label, value, tone, Icon }) => (
  <div className={`notif-stat-card tone-${tone}`}>
    <div className="notif-stat-ico">
      <Icon size={18} />
    </div>
    <div>
      <div className="notif-stat-value">{value ?? 0}</div>
      <div className="notif-stat-label">{label}</div>
    </div>
  </div>
);

export default Notifications;
