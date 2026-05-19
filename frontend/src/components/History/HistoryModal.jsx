import React, { useState, useEffect, useCallback } from 'react';
import { X, Activity, Clock, User, ChevronDown, ChevronRight } from 'lucide-react';
import { activityService } from '../../services/api';
import './HistoryModal.css';

const ACTION_META = {
  CREATE: { label: 'Created', tone: 'create', Icon: Activity },
  UPDATE: { label: 'Updated', tone: 'update', Icon: Activity },
  DELETE: { label: 'Deleted', tone: 'delete', Icon: Activity },
  LOGIN:  { label: 'Logged in', tone: 'login', Icon: Activity },
  LOGOUT: { label: 'Logged out', tone: 'logout', Icon: Activity },
};

const relativeTime = (iso) => {
  if (!iso) return '';
  const now = new Date();
  const then = new Date(iso);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return then.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

const fullTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
};

const HistoryModal = ({ isOpen, onClose, entityType, entityId, entityLabel }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const fetchHistory = useCallback(async () => {
    if (!isOpen || !entityType || !entityId) return;
    try {
      setLoading(true);
      const res = await activityService.getAll({ 
        entity_type: entityType, 
        entity_id: entityId,
        limit: 100 
      });
      setLogs(res.data || []);
    } catch (err) {
      console.error('Modal history fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [isOpen, entityType, entityId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const toggleExpanded = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderValue = (v) => {
    if (v === null || v === undefined || v === '') return <em className="hmod-empty-val">empty</em>;
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    return String(v);
  };

  if (!isOpen) return null;

  return (
    <div className="hmod-overlay" onClick={onClose}>
      <div className="hmod-content" onClick={e => e.stopPropagation()}>
        <header className="hmod-header">
          <div className="hmod-header-title">
            <div className="hmod-header-ico">
              <Clock size={20} />
            </div>
            <div>
              <h3>Item History</h3>
              <p>{entityLabel} <span className="hmod-type-tag">{entityType}</span></p>
            </div>
          </div>
          <button className="hmod-close" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="hmod-body">
          {loading ? (
            <div className="hmod-loading">
              <div className="hmod-spinner"></div>
              <span>Fetching audit logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="hmod-empty">
              <Activity size={32} />
              <p>No activity recorded for this item yet.</p>
            </div>
          ) : (
            <div className="hmod-timeline">
              {logs.map((log) => {
                const meta = ACTION_META[log.action] || { label: log.action, tone: 'update' };
                const isExpanded = expanded[log.id];
                const hasChanges = log.changes && Object.keys(log.changes).length > 0;

                return (
                  <div key={log.id} className="hmod-item">
                    <div className={`hmod-dot tone-${meta.tone}`}></div>
                    <div className="hmod-card">
                      <div className="hmod-card-header">
                        <div className="hmod-actor-info">
                          <User size={14} />
                          <span className="hmod-actor">{log.actor_name}</span>
                          <span className={`hmod-badge tone-${meta.tone}`}>{meta.label}</span>
                        </div>
                        <span className="hmod-time" title={fullTime(log.timestamp)}>
                          {relativeTime(log.timestamp)}
                        </span>
                      </div>

                      <p className="hmod-desc">{log.description}</p>

                      {hasChanges && log.action === 'UPDATE' && (
                        <button 
                          className="hmod-expand-btn"
                          onClick={() => toggleExpanded(log.id)}
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          {isExpanded ? 'Hide Changes' : `${Object.keys(log.changes).length} changes`}
                        </button>
                      )}

                      {isExpanded && hasChanges && (
                        <div className="hmod-diff">
                          {Object.entries(log.changes).map(([field, diff]) => (
                            <div key={field} className="hmod-diff-row">
                              <span className="hmod-field">{field.replace(/_/g, ' ')}</span>
                              <div className="hmod-diff-vals">
                                <span className="hmod-val-from">{renderValue(diff?.from)}</span>
                                <span className="hmod-arrow">→</span>
                                <span className="hmod-val-to">{renderValue(diff?.to)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
