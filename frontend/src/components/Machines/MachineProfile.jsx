import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Activity, Wrench, ShieldAlert, Calendar, User,
  ClipboardList, TrendingUp, History, Cpu, Factory, Tag, Hash,
  Gauge, FileText, Gift
} from 'lucide-react';
import { machineService } from '../../services/api';
import ServiceModal from './ServiceModal';
import './MachineProfile.css';

const MachineProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  const fetchMachineDetails = useCallback(async () => {
    try {
      const { data } = await machineService.getById(id);
      setMachine(data);
    } catch (err) {
      console.error('Error fetching machine details:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMachineDetails();
  }, [fetchMachineDetails]);

  const getLiveStatus = (timeSlot, currentStatus) => {
    if (currentStatus === 'Completed') return 'Completed';

    const [startStr] = timeSlot.split(' - ');
    const now = new Date();
    const [hours, minutes] = startStr.split(':');
    const isPM = startStr.includes('PM');

    const startTime = new Date();
    let h = parseInt(hours);
    if (isPM && h !== 12) h += 12;
    if (!isPM && h === 12) h = 0;
    startTime.setHours(h, parseInt(minutes), 0);

    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 4);

    if (now >= startTime && now <= endTime) return 'In-Progress';
    if (now > endTime) return 'Completed';
    return 'Upcoming';
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loader-spinner"></div>
        <p>Loading machine profile...</p>
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="profile-error">
        <ShieldAlert size={48} />
        <h2>Machine Not Found</h2>
        <button onClick={() => navigate('/machines')}>Back to Inventory</button>
      </div>
    );
  }

  const displayName = machine.model || 'Standard Unit';
  const typeLabel = (machine.type || 'Standard').replace('_', ' & ');
  const typeClass = (machine.type || 'standard').toLowerCase();
  const statusClass = (machine.status || '').toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="machine-profile-page">
      <header className="profile-header">
        <button className="back-btn" onClick={() => navigate('/machines')}>
          <ArrowLeft size={20} />
          <span>Back to Inventory</span>
        </button>
        <div className="header-main">
          <div className="title-group">
            <div className="profile-unit-tag">{machine.brand || 'FRESENIUS'}</div>
            <h1>{displayName}</h1>
            <div className="type-meta">
              {machine.type && machine.type.toLowerCase() !== 'standard' && (
                <span className={`type-pill ${typeClass}`}>
                  {typeLabel}
                </span>
              )}
              <span className={`status-dot ${statusClass}`}>
                {machine.status}
              </span>
              <span className="serial-pill">
                SN: <strong>{machine.serial_number || 'N/A'}</strong>
              </span>
              <span className="unit-location-pill">
                Branch: <strong>{machine.unit || 'kovai'}</strong>
              </span>
            </div>
          </div>
          <div className="header-actions">
            <button className="service-trigger-btn" onClick={() => setIsServiceModalOpen(true)}>
              <Wrench size={18} />
              Update Service
            </button>
          </div>
        </div>
      </header>

      <section className="profile-stats-row">
        <div className="stat-card">
          <div className="stat-icon uptime"><TrendingUp size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Uptime</span>
            <span className="stat-value">{machine.uptime_percentage ?? 0}%</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon sessions"><Activity size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Total Sessions</span>
            <span className="stat-value">{machine.total_sessions || 0}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon service"><Gauge size={20} /></div>
          <div className="stat-info">
            <span className="stat-label">Running Hours</span>
            <span className="stat-value">{machine.running_hours ?? 0} h</span>
          </div>
        </div>
      </section>

      <section className="specs-section">
        <div className="section-header">
          <Cpu size={20} />
          <h2>Equipment Specifications</h2>
        </div>
        <div className="specs-grid">
          <div className="spec-item">
            <span className="spec-label"><Factory size={12} /> Brand</span>
            <span className="spec-value">{machine.brand || '—'}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label"><Tag size={12} /> Model</span>
            <span className="spec-value">{machine.model || '—'}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label"><Hash size={12} /> Serial Number</span>
            <span className="spec-value">{machine.serial_number || machine.unit_number || '—'}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label"><Activity size={12} /> BPM Configuration</span>
            <span className="spec-value">{machine.has_bpm ? 'With BPM' : 'Without BPM'}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label"><Calendar size={12} /> Installation Date</span>
            <span className="spec-value">{machine.installation_date || '—'}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label"><ShieldAlert size={12} /> Warranty</span>
            <span className="spec-value">
              {machine.warranty_years
                ? `${machine.warranty_years} year${machine.warranty_years === 1 ? '' : 's'}`
                : '—'}
            </span>
          </div>
          <div className="spec-item">
            <span className="spec-label"><Calendar size={12} /> AMC From</span>
            <span className="spec-value">{machine.amc_from || '—'}</span>
          </div>
          <div className="spec-item">
            <span className="spec-label"><Calendar size={12} /> AMC Upto</span>
            <span className="spec-value">{machine.amc_upto || '—'}</span>
          </div>
          <div className="spec-item full-width">
            <span className="spec-label"><Gift size={12} /> Donated By</span>
            <span className="spec-value">{machine.donated_by || '—'}</span>
          </div>
          {machine.remarks && (
            <div className="spec-item full-width">
              <span className="spec-label"><FileText size={12} /> Remarks</span>
              <p className="spec-text">{machine.remarks}</p>
            </div>
          )}
        </div>
      </section>

      <div className="profile-grid">
        <div className="profile-left">
          <section className="schedule-section">
            <div className="section-header">
              <Calendar size={20} />
              <h2>Today's Schedule</h2>
            </div>
            <div className="schedule-list">
              {machine.today_sessions?.length > 0 ? machine.today_sessions.map((s, idx) => (
                <div key={idx} className="schedule-item">
                  <div className="time-col">{s.time_slot.split(' - ')[0]}</div>
                  <div className="patient-col">
                    <span className="p-name">{s.patient_name}</span>
                    <span className="p-id">#{s.patient_id}</span>
                  </div>
                  <div className={`status-col ${getLiveStatus(s.time_slot, s.status).toLowerCase()}`}>
                    {getLiveStatus(s.time_slot, s.status)}
                  </div>
                </div>
              )) : (
                <div className="empty-schedule">No sessions scheduled for today</div>
              )}
            </div>
          </section>
        </div>

        <div className="profile-right">
          <section className="history-section">
            <div className="section-header">
              <History size={20} />
              <h2>Service History</h2>
            </div>
            <div className="history-timeline">
              {machine.service_history?.length > 0 ? machine.service_history.map((log, idx) => (
                <div key={idx} className="timeline-entry">
                  <div className="entry-dot"></div>
                  <div className="entry-content">
                    <div className="entry-header">
                      <span className="entry-date">{log.service_date}</span>
                      <span className={`entry-type ${(log.service_type || '').toLowerCase()}`}>
                        {log.service_type}
                      </span>
                    </div>
                    {log.technician && (
                      <div className="entry-tech">
                        <User size={14} />
                        <span>{log.technician}</span>
                      </div>
                    )}
                    <p className="entry-notes">{log.notes || 'No maintenance notes provided.'}</p>
                  </div>
                </div>
              )) : (
                <div className="empty-history">
                  <ClipboardList size={32} />
                  <p>No service records available for this unit.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {isServiceModalOpen && (
        <ServiceModal
          isOpen={isServiceModalOpen}
          onClose={() => setIsServiceModalOpen(false)}
          machine={machine}
          onUpdate={() => { setIsServiceModalOpen(false); fetchMachineDetails(); }}
        />
      )}
    </div>
  );
};

export default MachineProfile;
