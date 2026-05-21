import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  PlusCircle,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  Search,
  Filter,
  Download,
  RefreshCcw,
  ChevronDown,
  ChevronRight,
  Users,
  Stethoscope,
  Monitor,
  CalendarCheck,
  Package,
  Receipt,
  ClipboardCheck,
  Wrench,
  UserSquare2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { activityService, userService } from '../../services/api';
import { useLocation } from 'react-router-dom';
import HistoryModal from './HistoryModal';
import './History.css';

const ACTION_META = {
  CREATE: { label: 'Created', tone: 'create', Icon: PlusCircle },
  UPDATE: { label: 'Updated', tone: 'update', Icon: Pencil },
  DELETE: { label: 'Deleted', tone: 'delete', Icon: Trash2 },
  LOGIN:  { label: 'Logged in', tone: 'login', Icon: LogIn },
  LOGOUT: { label: 'Logged out', tone: 'logout', Icon: LogOut },
};

const ENTITY_META = {
  Patient:     { label: 'Patient',    Icon: Users },
  Staff:       { label: 'Staff',      Icon: UserSquare2 },
  Machine:     { label: 'Machine',    Icon: Monitor },
  Appointment: { label: 'Appointment',Icon: CalendarCheck },
  Session:     { label: 'Session',    Icon: Stethoscope },
  ServiceLog:  { label: 'Service',    Icon: Wrench },
  Inventory:   { label: 'Inventory',  Icon: Package },
  Invoice:     { label: 'Invoice',    Icon: Receipt },
  Attendance:  { label: 'Attendance', Icon: ClipboardCheck },
  User:        { label: 'User',       Icon: Users },
};

const ENTITY_FILTERS = ['All', 'Patient', 'Staff', 'Machine', 'Session', 'Appointment', 'Inventory', 'Invoice', 'Attendance', 'ServiceLog', 'User'];
const ACTION_FILTERS = ['All', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];

const relativeTime = (iso) => {
  if (!iso) return '';
  const now = new Date();
  const then = new Date(iso);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 5) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return then.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fullTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

const dayBucket = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const initialsFor = (name) => {
  if (!name) return '?';
  return name.split(' ').map((s) => s.charAt(0)).slice(0, 2).join('').toUpperCase();
};

const History = () => {
  const location = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialEntity = queryParams.get('entity') || 'All';

  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({ total: 0, today: 0, this_week: 0, creates: 0, updates: 0, deletes: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [action, setAction] = useState('All');
  const [entity, setEntity] = useState(initialEntity);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('All');
  const [search, setSearch] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [modalLog, setModalLog] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const pollRef = useRef(null);

  useEffect(() => {
    const qEntity = queryParams.get('entity');
    if (qEntity) {
      setEntity(qEntity);
    }
  }, [queryParams]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await userService.getAll();
        setUsers(data || []);
      } catch (err) {
        console.error('Failed to fetch users for filter:', err);
      }
    };
    fetchUsers();
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    try {
      if (silent) setRefreshing(true); else setLoading(true);
      const params = { limit: 200 };
      if (action !== 'All') params.action = action;
      if (entity !== 'All') params.entity_type = entity;
      if (selectedUser !== 'All') params.user = selectedUser;
      if (search) params.search = search;
      if (start) params.start_date = start;
      if (end) params.end_date = end;
      const [logsRes, summaryRes] = await Promise.all([
        activityService.getAll(params),
        activityService.getSummary(),
      ]);
      setLogs(logsRes.data || []);
      setSummary(summaryRes.data || {});
    } catch (err) {
      console.error('History fetch failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [action, entity, selectedUser, search, start, end]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 15s when enabled
  useEffect(() => {
    if (!autoRefresh) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(pollRef.current);
  }, [autoRefresh, fetchData]);

  const grouped = useMemo(() => {
    const map = new Map();
    logs.forEach((log) => {
      const key = dayBucket(log.timestamp);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(log);
    });
    return Array.from(map.entries());
  }, [logs]);

  const exportCSV = () => {
    const headers = ['Timestamp', 'Actor', 'Action', 'Entity', 'Target', 'Description', 'IP'];
    const rows = logs.map((l) => [
      l.timestamp, l.actor_name, l.action, l.entity_type, l.entity_label, l.description, l.ip_address || '',
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setAction('All'); setEntity('All'); setSelectedUser('All'); setSearch(''); setStart(''); setEnd('');
  };

  const focusEntity = (log) => {
    if (!log.entity_id || !log.entity_type) return;
    setModalLog(log);
  };

  const toggleExpanded = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="hist-container">
      {/* Header */}
      <header className="hist-header">
        <div className="hist-hero">
          <div className="hist-hero-ico">
            <Activity size={20} />
          </div>
          <div>
            <h2 className="hist-hero-title">Activity Timeline</h2>
            <p className="hist-hero-sub">
              Every create, update, and delete across the system — automatically captured.
              {refreshing && <span className="hist-live-dot"> live</span>}
            </p>
          </div>
        </div>
        <div className="hist-actions">
          <label className="hist-toggle" title="Auto-refresh every 15 seconds">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            <span className="hist-toggle-slider" />
            <span className="hist-toggle-text">Auto-refresh</span>
          </label>
          <button className="hist-btn hist-btn-ghost" onClick={() => fetchData(true)}>
            <RefreshCcw size={16} className={refreshing ? 'spin' : ''} /> Refresh
          </button>
          <button className="hist-btn hist-btn-ghost" onClick={exportCSV} disabled={!logs.length}>
            <Download size={16} /> Export
          </button>
        </div>
      </header>

      {/* Stats */}
      <section className="hist-stats">
        <StatCard label="Total Events" value={summary.total} tone="total" Icon={Sparkles} />
        <StatCard label="Today" value={summary.today} tone="today" Icon={Clock} />
        <StatCard label="Created" value={summary.creates} tone="create" Icon={PlusCircle} />
        <StatCard label="Updated" value={summary.updates} tone="update" Icon={Pencil} />
        <StatCard label="Deleted" value={summary.deletes} tone="delete" Icon={Trash2} />
      </section>

      {/* Filters */}
      <section className="hist-controls">
        <div className="hist-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by description, target, or who performed the action…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="hist-filter-row">
          <div className="hist-filter-group">
            <Filter size={14} className="hist-filter-ico" />
            <span className="hist-filter-label">Action</span>
            <select className="hist-select" value={action} onChange={(e) => setAction(e.target.value)}>
              {ACTION_FILTERS.map((a) => (
                <option key={a} value={a}>{a === 'All' ? 'All actions' : ACTION_META[a]?.label || a}</option>
              ))}
            </select>
          </div>

          <div className="hist-filter-group">
            <span className="hist-filter-label">Module</span>
            <select className="hist-select" value={entity} onChange={(e) => setEntity(e.target.value)}>
              {ENTITY_FILTERS.map((opt) => (
                <option key={opt} value={opt}>{opt === 'All' ? 'All modules' : ENTITY_META[opt]?.label || opt}</option>
              ))}
            </select>
          </div>

          <div className="hist-filter-group">
            <span className="hist-filter-label">User</span>
            <select className="hist-select" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
              <option value="All">All users</option>
              {users.map((u) => {
                const displayName = (u.first_name || u.last_name)
                  ? `${u.first_name} ${u.last_name}`.trim()
                  : u.username;
                return (
                  <option key={u.id} value={u.id}>
                    {displayName}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="hist-filter-group hist-date-group">
            <span className="hist-filter-label">From</span>
            <input className="hist-date" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            <span className="hist-filter-label">To</span>
            <input className="hist-date" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            <button className="hist-link-btn" onClick={resetFilters}>Reset</button>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="hist-timeline">
        {loading ? (
          <div className="hist-empty">Loading activity…</div>
        ) : logs.length === 0 ? (
          <div className="empty-state-container">
            <div className="empty-state-card">
              <Activity size={48} className="empty-state-icon" />
              <h4>No Activity Recorded</h4>
              <p>
                {search || action !== 'All' || entity !== 'All' || start || end
                  ? 'No system logs match your active search filters.'
                  : 'System actions like creating a patient, updating a record, or deleting will appear here in real time.'}
              </p>
            </div>
          </div>
        ) : (
          grouped.map(([day, entries]) => (
            <div key={day} className="hist-day">
              <div className="hist-day-header">
                <span className="hist-day-label">{day}</span>
                <span className="hist-day-count">{entries.length} {entries.length === 1 ? 'event' : 'events'}</span>
              </div>
              <div className="hist-day-body">
                {entries.map((log) => {
                  const meta = ACTION_META[log.action] || { label: log.action, tone: 'update', Icon: Activity };
                  const entityMeta = ENTITY_META[log.entity_type] || { label: log.entity_type, Icon: Activity };
                  const ActionIcon = meta.Icon;
                  const EntityIcon = entityMeta.Icon;
                  const hasChanges = log.changes && Object.keys(log.changes).length > 0;
                  const isExpanded = expanded[log.id];
                  return (
                    <article key={log.id} className="hist-item">
                      <div className={`hist-dot tone-${meta.tone}`}>
                        <ActionIcon size={14} />
                      </div>

                      <div className="hist-card clickable" onClick={() => focusEntity(log)} title="Click to view entire history for this item">
                        <div className="hist-card-top">
                          <div className="hist-actor">
                            <div className="hist-avatar">{initialsFor(log.actor_name)}</div>
                            <div className="hist-actor-meta">
                              <div className="hist-actor-name">
                                {log.actor_name}
                                {log.is_admin && log.user_username && log.user_username !== log.actor_name && (
                                  <span className="hist-username">({log.user_username})</span>
                                )}
                                <span className={`hist-chip tone-${meta.tone}`}>{meta.label}</span>
                                <span className="hist-entity-chip">
                                  <EntityIcon size={11} /> {entityMeta.label}
                                </span>
                              </div>
                              <div className="hist-actor-sub" title={fullTime(log.timestamp)}>
                                {relativeTime(log.timestamp)} · {fullTime(log.timestamp)}
                                {log.ip_address && <span className="hist-ip"> · {log.ip_address}</span>}
                              </div>
                            </div>
                          </div>

                          {hasChanges && log.action === 'UPDATE' && (
                            <button
                              className="hist-expand"
                              onClick={(e) => { e.stopPropagation(); toggleExpanded(log.id); }}
                              aria-label="Toggle change details"
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              {Object.keys(log.changes).length} change{Object.keys(log.changes).length === 1 ? '' : 's'}
                            </button>
                          )}
                        </div>

                        <p className="hist-desc">{log.description}</p>

                        {isExpanded && hasChanges && log.action === 'UPDATE' && (
                          <div className="hist-diff">
                            {Object.entries(log.changes).map(([field, diff]) => (
                              <div key={field} className="hist-diff-row">
                                <span className="hist-diff-field">{field.replace(/_/g, ' ')}</span>
                                <span className="hist-diff-from">{renderValue(diff?.from)}</span>
                                <span className="hist-diff-arrow">→</span>
                                <span className="hist-diff-to">{renderValue(diff?.to)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </section>

      <HistoryModal
        isOpen={!!modalLog}
        onClose={() => setModalLog(null)}
        entityType={modalLog?.entity_type}
        entityId={modalLog?.entity_id}
        entityLabel={modalLog?.entity_label}
      />
    </div>
  );
};

const StatCard = ({ label, value, tone, Icon }) => (
  <div className={`hist-stat-card tone-${tone}`}>
    <div className="hist-stat-ico">
      <Icon size={18} />
    </div>
    <div>
      <div className="hist-stat-value">{value ?? 0}</div>
      <div className="hist-stat-label">{label}</div>
    </div>
  </div>
);

const renderValue = (v) => {
  if (v === null || v === undefined || v === '') return <em className="hist-empty-val">empty</em>;
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') return JSON.stringify(v).slice(0, 60);
  const s = String(v);
  return s.length > 80 ? s.slice(0, 80) + '…' : s;
};

export default History;
