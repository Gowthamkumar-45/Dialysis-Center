import React, { useState, useEffect } from 'react';
import { X, Save, Activity, Heart, Weight, User, Clock, AlertCircle, CheckCircle, Clipboard, Edit2 } from 'lucide-react';
import { treatmentSessionService, staffService } from '../../services/api';
import './SessionDetailModal.css';

const SessionDetailModal = ({ isOpen, onClose, session, onRefresh, isEditMode = false }) => {
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(isEditMode);
  const [staffMembers, setStaffMembers] = useState([]);
  const [formData, setFormData] = useState({
    post_weight: '',
    post_bp: '',
    fluid_removed: '',
    heparin_dose: '',
    medications_given: '',
    complications: '',
    outcome: 'Optimal',
    staff: ''
  });

  useEffect(() => {
    setEditMode(isEditMode);
  }, [isEditMode, isOpen]);

  useEffect(() => {
    if (session && isOpen) {
      setFormData({
        post_weight: session.post_weight || '',
        post_bp: session.post_bp || '',
        fluid_removed: session.fluid_removed || '',
        heparin_dose: session.heparin_dose || '',
        medications_given: session.medications_given || '',
        complications: session.complications || '',
        outcome: session.outcome || 'Optimal',
        staff: session.staff || ''
      });
    }
  }, [session, isOpen]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await staffService.getAll();
        setStaffMembers(response.data);
      } catch (error) {
        console.error('Error fetching staff members:', error);
      }
    };
    if (isOpen && editMode) fetchStaff();
  }, [isOpen, editMode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Clean up numeric fields to prevent 400 Bad Request
      const cleanedData = {
        ...formData,
        post_weight: formData.post_weight === '' ? null : parseFloat(formData.post_weight),
        fluid_removed: formData.fluid_removed === '' ? null : parseFloat(formData.fluid_removed),
        status_color: formData.outcome === 'Optimal' ? 'green' : 
                      (formData.outcome === 'Critical' || formData.outcome === 'Bleeding') ? 'red' : 'yellow'
      };

      await treatmentSessionService.update(session.id, cleanedData);
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error updating session:', error);
      alert('Failed to update treatment session.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !session) return null;

  return (
    <div className="modal-overlay">
      <div className="session-detail-modal animate-pop">
        <header className="modal-header">
          <div className="header-title">
            <h2>{editMode ? 'Edit Treatment Record' : 'Treatment Session Details'}</h2>
            <p>{session.date} • {session.time} • {session.machine}</p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="modal-body">
          {editMode ? (
            /* EDIT MODE: PREMIUM FORM LAYOUT */
            <div className="session-edit-form">
              <div className="form-section">
                <div className="form-group full-width">
                  <label><User size={16} /> Staff In-Charge</label>
                  <select 
                    name="staff"
                    value={formData.staff}
                    onChange={handleInputChange}
                    className="modal-select"
                  >
                    <option value="">Select Staff...</option>
                    {formData.staff && !staffMembers.some(s => s.name === formData.staff) && (
                      <option value={formData.staff}>{formData.staff}</option>
                    )}
                    {['Doctor', 'Nurse', 'Technician', 'Support'].map(role => {
                      const roleStaff = staffMembers.filter(s => s.role === role);
                      return roleStaff.length > 0 && (
                        <optgroup key={role} label={`${role}s`}>
                          {roleStaff.map(s => (
                            <option key={s.id} value={s.name}>{s.name}</option>
                          ))}
                        </optgroup>
                      );
                    })}
                    {staffMembers.length === 0 && (
                      <>
                        <optgroup label="Doctors">
                          <option value="Dr. Sarah Wilson">Dr. Sarah Wilson</option>
                          <option value="Dr. James Miller">Dr. James Miller</option>
                        </optgroup>
                        <optgroup label="Nurses">
                          <option value="RN Mark Thompson">RN Mark Thompson</option>
                          <option value="RN Elena Cruz">RN Elena Cruz</option>
                        </optgroup>
                        <optgroup label="Technicians">
                          <option value="Tech David Chen">Tech David Chen</option>
                        </optgroup>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="form-grid-two-col">
                <div className="form-group">
                  <label><Weight size={16} /> Post-Weight</label>
                  <div className="input-with-unit">
                    <input type="number" name="post_weight" value={formData.post_weight} onChange={handleInputChange} step="0.1" placeholder="0.0" />
                    <span className="unit-tag">kg</span>
                  </div>
                </div>

                <div className="form-group">
                  <label><Heart size={16} /> Blood Pressure</label>
                  <div className="input-with-unit">
                    <input type="text" name="post_bp" value={formData.post_bp} onChange={handleInputChange} placeholder="120/80" />
                    <span className="unit-tag">mmHg</span>
                  </div>
                </div>

                <div className="form-group">
                  <label><Activity size={16} /> Fluid Removed</label>
                  <div className="input-with-unit">
                    <input type="number" name="fluid_removed" value={formData.fluid_removed} onChange={handleInputChange} step="0.1" placeholder="0.0" />
                    <span className="unit-tag">L</span>
                  </div>
                </div>

                <div className="form-group">
                  <label><CheckCircle size={16} /> Heparin Dose</label>
                  <div className="input-with-unit">
                    <input type="text" name="heparin_dose" value={formData.heparin_dose} onChange={handleInputChange} placeholder="0" />
                    <span className="unit-tag">U</span>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-group full-width">
                  <label><Clock size={16} /> Outcome Status</label>
                  <select name="outcome" value={formData.outcome} onChange={handleInputChange} className="modal-select">
                    <option value="Optimal">Optimal</option>
                    <option value="Stable">Stable</option>
                    <option value="Cramps Observed">Muscle Cramps</option>
                    <option value="BP Dip Observed">Hypotension (BP Dip)</option>
                    <option value="Nausea/Vomiting">Nausea / Vomiting</option>
                    <option value="Bleeding">Excessive Bleeding</option>
                    <option value="Critical">Critical Complication</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label><Clipboard size={16} /> Medications Given</label>
                  <textarea name="medications_given" value={formData.medications_given} onChange={handleInputChange} rows="2" placeholder="List administered medications..."></textarea>
                </div>

                <div className="form-group full-width">
                  <label><AlertCircle size={16} /> Complications / Notes</label>
                  <textarea name="complications" value={formData.complications} onChange={handleInputChange} rows="2" placeholder="Record any complications or clinical observations..."></textarea>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW MODE: CLINICAL CARD LAYOUT */
            <div className="session-card-view">
              <div className="card-top-strip">
                <div className="staff-info-card">
                  <User size={20} />
                  <div className="s-text">
                    <span className="s-label">Attending Clinician</span>
                    <span className="s-val">{session.staff}</span>
                  </div>
                </div>
                <div className={`outcome-badge-large ${session.statusColor}`}>
                  <span className="dot"></span>
                  {session.outcome}
                </div>
              </div>

              <div className="vitals-grid-card">
                <div className="v-item-card">
                  <Weight size={18} />
                  <div className="v-data">
                    <span className="v-l">Post-Weight</span>
                    <span className="v-v">{session.post_weight || '--'} <small>kg</small></span>
                  </div>
                </div>
                <div className="v-item-card">
                  <Heart size={18} />
                  <div className="v-data">
                    <span className="v-l">Blood Pressure</span>
                    <span className="v-v">{session.post_bp || '--'} <small>mmHg</small></span>
                  </div>
                </div>
                <div className="v-item-card">
                  <Activity size={18} />
                  <div className="v-data">
                    <span className="v-l">Fluid Removed</span>
                    <span className="v-v">{session.fluid_removed || '--'} <small>L</small></span>
                  </div>
                </div>
                <div className="v-item-card">
                  <CheckCircle size={18} />
                  <div className="v-data">
                    <span className="v-l">Heparin Dose</span>
                    <span className="v-v">{session.heparin_dose || '--'}</span>
                  </div>
                </div>
              </div>

              <div className="text-sections-card">
                <div className="section-card">
                  <div className="sec-header">
                    <Clipboard size={16} />
                    <span>Medications Administered</span>
                  </div>
                  <div className="sec-content">{session.medications_given || 'No medications recorded for this session.'}</div>
                </div>
                
                <div className="section-card">
                  <div className="sec-header">
                    <AlertCircle size={16} />
                    <span>Clinical Notes & Complications</span>
                  </div>
                  <div className="sec-content">{session.complications || 'No complications or additional notes recorded.'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            {editMode ? 'Cancel' : 'Close'}
          </button>
          {editMode ? (
            <button className="save-btn" onClick={handleSave} disabled={loading}>
              <Save size={18} />
              <span>{loading ? 'Saving...' : 'Update Record'}</span>
            </button>
          ) : (
            <button className="edit-btn-alt" onClick={() => setEditMode(true)}>
              <Edit2 size={18} />
              <span>Edit Record</span>
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};

export default SessionDetailModal;
