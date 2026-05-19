import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Package,
  Users,
  UserSquare2,
  Monitor,
  Stethoscope,
  CalendarCheck,
  Receipt,
  ClipboardCheck,
  Settings,
  X,
} from 'lucide-react';
import { notificationService } from '../../services/api';
import './NotificationBell.css';

const SEVERITY_META = {
  info:     { Icon: Info,          tone: 'info' },
  success:  { Icon: CheckCircle2,  tone: 'success' },
  warning:  { Icon: AlertTriangle, tone: 'warning' },
  critical: { Icon: AlertCircle,   tone: 'critical' },
};

const CATEGORY_ICON = {
  patient:     Users,
  staff:       UserSquare2,
  machine:     Monitor,
  session:     Stethoscope,
  appointment: CalendarCheck,
  inventory:   Package,
  billing:     Receipt,
  attendance:  ClipboardCheck,
  system:      Settings,
};

const relativeTime = (iso) => {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const pollRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await notificationService.getUnreadCount();
      setUnreadCount(data.count || 0);
    } catch {
      // silent
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await notificationService.getAll({ limit: 15 });
      setNotifications(data || []);
    } catch (err) {
      console.error('Notifications fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + poll every 30s for unread count
  useEffect(() => {
    fetchUnreadCount();
    pollRef.current = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(pollRef.current);
  }, [fetchUnreadCount]);

  // Load notifications when dropdown opens
  useEffect(() => {
    if (open) fetchNotifications();
  }, [open, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleItemClick = async (n) => {
    if (!n.is_read) {
      try {
        await notificationService.markRead(n.id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
        );
      } catch {
        // ignore
      }
    }
    if (n.link) {
      navigate(n.link);
      setOpen(false);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await notificationService.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Mark all read failed:', err);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationService.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      fetchUnreadCount();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleSeeAll = () => {
    setOpen(false);
    navigate('/notifications');
  };

  return (
    <div className="nb-wrapper" ref={wrapperRef}>
      <button
        className={`nb-trigger ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="nb-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="nb-dropdown">
          <div className="nb-header">
            <div>
              <h4>Notifications</h4>
              <span className="nb-header-sub">
                {unreadCount > 0 ? `${unreadCount} unread` : 'You’re all caught up'}
              </span>
            </div>
            {unreadCount > 0 && (
              <button className="nb-mark-all" onClick={handleMarkAllRead}>
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="nb-list">
            {loading ? (
              <div className="nb-empty">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="nb-empty">
                <Bell size={28} />
                <p>No notifications yet</p>
                <span>You'll see alerts here when things need your attention.</span>
              </div>
            ) : (
              notifications.map((n) => {
                const meta = SEVERITY_META[n.severity] || SEVERITY_META.info;
                const CatIcon = CATEGORY_ICON[n.category] || Settings;
                const SeverityIcon = meta.Icon;
                return (
                  <div
                    key={n.id}
                    className={`nb-item tone-${meta.tone} ${!n.is_read ? 'unread' : ''}`}
                    onClick={() => handleItemClick(n)}
                  >
                    <div className={`nb-item-ico tone-${meta.tone}`}>
                      <SeverityIcon size={16} />
                    </div>
                    <div className="nb-item-body">
                      <div className="nb-item-title-row">
                        <span className="nb-item-title">{n.title}</span>
                        <span className="nb-item-cat">
                          <CatIcon size={10} /> {n.category}
                        </span>
                      </div>
                      <p className="nb-item-msg">{n.message}</p>
                      <span className="nb-item-time">{relativeTime(n.created_at)}</span>
                    </div>
                    <button
                      className="nb-item-close"
                      onClick={(e) => handleDelete(e, n.id)}
                      aria-label="Dismiss"
                    >
                      <X size={13} />
                    </button>
                    {!n.is_read && <span className="nb-unread-dot" />}
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="nb-footer">
              <button className="nb-see-all" onClick={handleSeeAll}>
                See all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
