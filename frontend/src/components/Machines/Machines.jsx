import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Settings, ShieldAlert, Plus, Search,
  RefreshCw, Trash2, Monitor, AlertTriangle, X, Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { machineService } from '../../services/api';
import MachineModal from './MachineModal';
import ServiceModal from './ServiceModal';
import './Machines.css';

/* ─── Custom Confirm Dialog (replaces window.confirm) ─── */
const ConfirmDialog = ({ message, onConfirm, onCancel }) => (
  <div className="confirm-overlay" onClick={onCancel}>
    <motion.div
      className="confirm-box"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={e => e.stopPropagation()}
    >
      <div className="confirm-icon"><AlertTriangle size={28} color="#ef4444" /></div>
      <h3 className="confirm-title">Are you sure?</h3>
      <p className="confirm-message">{message}</p>
      <div className="confirm-actions">
        <button className="confirm-cancel" onClick={onCancel}>Cancel</button>
        <button className="confirm-delete" onClick={onConfirm}>Yes, Delete</button>
      </div>
      <button className="confirm-close" onClick={onCancel}><X size={18} /></button>
    </motion.div>
  </div>
);

/* ─── Group config ─── */
const MACHINE_GROUPS = [
  { type: 'Standard', label: 'Standard Units', icon: <Activity size={20} color="#3b82f6" />, desc: 'General dialysis allocation' },
  { type: 'HIV', label: 'HIV-Dedicated', icon: <ShieldAlert size={20} color="#ef4444" />, desc: 'Isolated for HIV+ patients' },
  { type: 'HCV', label: 'HCV-Dedicated', icon: <Monitor size={20} color="#a855f7" />, desc: 'Specialised for HCV patients' },
  { type: 'HIV_HCV', label: 'Combined Isolation', icon: <ShieldAlert size={20} color="#701a75" />, desc: 'HIV & HCV co-infection units' },
];

/* ─── MachineCard – OUTSIDE parent so it never remounts ─── */
const MachineCard = ({ machine, onDeleteClick, onEdit, onServiceClick, onStatusChange }) => {
  const navigate = useNavigate();
  const statusClass = machine.status.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="machine-card-premium" onClick={() => navigate(`/machines/${machine.id}`)} style={{ cursor: 'pointer' }}>

      <div className="machine-id-section" style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '1.25rem' }}>
        <span className="brand-label" style={{ fontSize: '0.65rem', fontWeight: 800, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {machine.brand || 'FRESENIUS'}
        </span>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
          <h3 className="unit-model" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
            {machine.model || '4008 S'}
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {machine.type && machine.type.toLowerCase() !== 'standard' && (
              <span className={`machine-type-badge badge-${machine.type.toLowerCase()}`} style={{ fontSize: '0.65rem', padding: '4px 8px', borderRadius: '6px' }}>
                {machine.type.replace('_', ' & ')}
              </span>
            )}
            <div className="status-badge-modern">
              <div className={`status-orb ${statusClass}`}></div>
              <span>{machine.status}</span>
            </div>
          </div>
        </div>
        <span className="unit-serial" style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginTop: '4px' }}>
          SN: {machine.serial_number || 'NOT ASSIGNED'}
        </span>
      </div>

      {/* Patient info removed */}

      <div className="service-info">
        <Settings size={14} />
        <span>Last Service: {machine.last_service_date || 'None Recorded'}</span>
      </div>

      <div className="quick-actions">
        {['In Use', 'Maintenance', 'Out of Service'].map(s => (
          <button
            key={s}
            type="button"
            className={`q-btn ${machine.status === s ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onStatusChange(machine, s); }}
          >
            {s.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="card-footer-actions">
        <button type="button" className="configure-link" onClick={(e) => { e.stopPropagation(); onEdit(machine); }}>
          Edit Configuration
        </button>
        <button
          type="button"
          className="footer-service-btn"
          onClick={(e) => { e.stopPropagation(); onServiceClick(machine); }}
          title="Service Log"
        >
          <Wrench size={20} />
        </button>
        <button
          type="button"
          className="footer-delete-btn"
          onClick={(e) => { e.stopPropagation(); onDeleteClick(machine.id, machine.unit_number); }}
          title="Delete Unit"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
};

/* ─── Main Machines component ─── */
const Machines = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  /* custom dialog state */
  const [confirmState, setConfirmState] = useState({
    visible: false,
    message: '',
    onConfirm: null,
  });

  const openConfirm = useCallback((message, onConfirm) => {
    setConfirmState({ visible: true, message, onConfirm });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmState({ visible: false, message: '', onConfirm: null });
  }, []);

  /* fetch */
  const fetchMachines = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await machineService.getAll();
      setMachines(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMachines(); }, [fetchMachines]);

  const filteredMachines = machines.filter(m => 
    (m.unit_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (m.type?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (m.status?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  /* handlers */
  const handleAdd = () => { setSelectedMachine(null); setIsModalOpen(true); };
  const handleEdit = (m) => { setSelectedMachine(m); setIsModalOpen(true); };
  const handleServiceClick = (m) => { setSelectedMachine(m); setIsServiceModalOpen(true); };

  const handleUpdateMachine = async (id, data) => {
    try {
      await machineService.update(id, data);
      fetchMachines();
    } catch (err) {
      console.error('Update error:', err);
      throw err;
    }
  };

  const handleDeleteClick = useCallback((id, unitNum) => {
    openConfirm(
      `Permanently remove Unit ${unitNum}? This cannot be undone.`,
      async () => {
        closeConfirm();
        try {
          await machineService.delete(id);
          setMachines(prev => prev.filter(m => m.id !== id));
        } catch (err) {
          console.error('Delete error:', err);
          openConfirm('Could not delete this machine. It may be linked to active appointment records.', closeConfirm);
        }
      }
    );
  }, [openConfirm, closeConfirm]);


  const handleStatusChange = useCallback(async (machine, newStatus) => {
    try {
      await machineService.update(machine.id, { ...machine, status: newStatus });
      setMachines(prev =>
        prev.map(m => m.id === machine.id ? { ...m, status: newStatus } : m)
      );
    } catch (err) {
      console.error('Status update error:', err);
    }
  }, []);

  return (
    <div className="machines-page">

      {/* Custom confirm dialog */}
      <AnimatePresence>
        {confirmState.visible && (
          <ConfirmDialog
            message={confirmState.message}
            onConfirm={confirmState.onConfirm}
            onCancel={closeConfirm}
          />
        )}
      </AnimatePresence>

      <header className="page-header-minimal">
        <div className="header-main">
          <div className="search-group-modern">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search units, status, or types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="header-actions-group">
            <button className="add-unit-btn" onClick={handleAdd}>
              <Plus size={18} /> Add Machine
            </button>
          </div>
        </div>
      </header>

      <div className="machines-content">
        {loading ? (
          <div className="loading-state">
            <RefreshCw size={32} className="spin-icon" />
            <span>Loading units…</span>
          </div>
        ) : filteredMachines.length === 0 ? (
          <div className="empty-floor-state">
            <Monitor size={64} color="#cbd5e1" />
            <h3>{searchTerm ? 'No units match your search' : 'No machines registered'}</h3>
            <p>{searchTerm ? 'Try a different keyword.' : 'Add a new dialysis unit to get started.'}</p>
            {!searchTerm && (
              <button className="add-unit-btn" onClick={handleAdd} style={{ marginTop: '2rem' }}>
                <Plus size={18} /> Add First Machine
              </button>
            )}
          </div>
        ) : (
          MACHINE_GROUPS.map(group => {
            const grouped = filteredMachines.filter(m => m.type === group.type);
            if (grouped.length === 0) return null;
            return (
              <div key={group.type} className="machine-group-section">
                <div className="group-header">
                  <div className="group-icon-box">{group.icon}</div>
                  <div className="group-info">
                    <h2>{group.label}</h2>
                    <span>{grouped.length} unit{grouped.length !== 1 ? 's' : ''} · {group.desc}</span>
                  </div>
                </div>
                <div className="machines-grid-modern">
                  {grouped.map(m => (
                    <MachineCard
                      key={m.id}
                      machine={m}
                      onDeleteClick={handleDeleteClick}
                      onEdit={handleEdit}
                      onServiceClick={handleServiceClick}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <MachineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={fetchMachines}
        machine={selectedMachine}
      />

      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        machine={selectedMachine}
        onUpdate={handleUpdateMachine}
      />
    </div>
  );
};

export default Machines;
