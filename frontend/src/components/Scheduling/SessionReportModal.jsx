import React, { useState, useEffect } from 'react';
import { X, Save, Activity, Heart, Weight, AlertCircle, CheckCircle, User } from 'lucide-react';
import { appointmentService, patientService, treatmentSessionService, staffService } from '../../services/api';
import './SessionReportModal.css';

const SessionReportModal = ({ isOpen, onClose, appointment, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    attending_staff: '',
    post_weight: '',
    post_bp: '',
    fluid_removed: '',
    heparin_dose: '',
    medications_given: '',
    complications: '',
    outcome: 'Optimal',
    notes: ''
  });
  const [staffMembers, setStaffMembers] = useState([]);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const response = await staffService.getAll();
        setStaffMembers(response.data);
      } catch (error) {
        console.error('Error fetching staff members:', error);
      }
    };
    fetchStaff();
  }, []);

  useEffect(() => {
    if (appointment && isOpen) {
      // Initialize with any existing data if available
      setFormData({
        attending_staff: appointment.staff_name || appointment.attending_staff || '',
        post_weight: appointment.post_weight || '',
        post_bp: appointment.post_bp || '',
        fluid_removed: appointment.fluid_removed || '',
        heparin_dose: appointment.heparin_dose || '',
        medications_given: appointment.medications_given || '',
        complications: appointment.complications || '',
        outcome: appointment.outcome || 'Optimal',
        notes: appointment.notes || ''
      });
    }
  }, [appointment, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      // Update appointment status and clinical data
      await appointmentService.update(appointment.id, {
        ...formData,
        status: 'Completed'
      });

      // Determine the best staff name to record
      const finalStaffName = formData.attending_staff || appointment.staff_name || 'Medical Staff';

      // Safely parse numeric values to avoid NaN errors
      const safePostWeight = formData.post_weight ? parseFloat(formData.post_weight) : null;
      const safeFluidRemoved = formData.fluid_removed ? parseFloat(formData.fluid_removed) : null;

      // Create a permanent Treatment Session record for history
      await treatmentSessionService.create({
        patient: appointment.patient,
        machine: `Unit ${appointment.machine_unit || 'Unknown'}`,
        staff: finalStaffName,
        date: appointment.date,
        time: appointment.time_slot.split(' - ')[0],
        duration: "4h 00m", // Standard duration
        post_weight: safePostWeight,
        post_bp: formData.post_bp,
        fluid_removed: safeFluidRemoved,
        heparin_dose: formData.heparin_dose,
        medications_given: formData.medications_given,
        complications: formData.complications || formData.outcome,
        outcome: formData.outcome,
        status_color: formData.outcome === 'Optimal' ? 'green' : 
                      (formData.outcome === 'Critical' || formData.outcome === 'Bleeding') ? 'red' : 'yellow'
      });
      
      // Optionally update patient's latest vitals
      if (formData.post_weight || formData.post_bp) {
        await patientService.update(appointment.patient, {
          current_weight: formData.post_weight || undefined,
          blood_pressure: formData.post_bp || undefined
        });
      }

      onRefresh();
      onClose();
    } catch (error) {
      console.error('Error completing session:', error);
      alert('Failed to save session report. Please check the data.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content session-report-modal animate-pop">
        <header className="modal-header">
          <div className="header-title">
            <h2>Post-Dialysis Report</h2>
            <p>Patient: {appointment.patient_name} • Unit {appointment.machine_unit} • {appointment.time_slot}</p>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="modal-body">
          <div className="report-vitals-grid">
            <div className="form-group full-width" style={{ gridColumn: 'span 2' }}>
              <label><User size={16} /> Attended Name</label>
              <select 
                name="attending_staff"
                value={formData.attending_staff}
                onChange={handleInputChange}
                className="modal-select"
              >
                <option value="">Select Attending Staff...</option>
                {formData.attending_staff && !staffMembers.some(s => s.name === formData.attending_staff) && (
                  <option value={formData.attending_staff}>{formData.attending_staff}</option>
                )}
                {['Doctor', 'Nurse', 'Technician', 'Support'].map(role => {
                  const roleStaff = staffMembers.filter(s => s.role === role);
                  if (roleStaff.length === 0) return null;
                  return (
                    <optgroup key={role} label={`${role}s`}>
                      {roleStaff.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </optgroup>
                  );
                })}
                {/* Fallback if no staff in DB yet */}
                {staffMembers.length === 0 && (
                  <>
                    <optgroup label="Doctors">
                      <option value="Dr. Sarah Wilson">Dr. Sarah Wilson</option>
                      <option value="Dr. James Miller">Dr. James Miller</option>
                    </optgroup>
                    <optgroup label="Nurses">
                      <option value="RN Mark Thompson">RN Mark Thompson</option>
                      <option value="RN Elena Cruz">RN Elena Cruz</option>
                      <option value="RN Priya Sharma">RN Priya Sharma</option>
                    </optgroup>
                    <optgroup label="Technicians">
                      <option value="Tech David Chen">Tech David Chen</option>
                    </optgroup>
                  </>
                )}
              </select>
            </div>
            <div className="form-group">
              <label><Weight size={16} /> Post-Treatment Weight (kg)</label>
              <input 
                type="number" 
                name="post_weight"
                value={formData.post_weight}
                onChange={handleInputChange}
                placeholder="0.0 kg"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label><Heart size={16} /> Post-Treatment BP (mmHg)</label>
              <input 
                type="text" 
                name="post_bp"
                value={formData.post_bp}
                onChange={handleInputChange}
                placeholder="120/80"
              />
            </div>
            <div className="form-group">
              <label><Activity size={16} /> Total Fluid Removed (L)</label>
              <input 
                type="number" 
                name="fluid_removed"
                value={formData.fluid_removed}
                onChange={handleInputChange}
                placeholder="0.0 L"
                step="0.1"
              />
            </div>
            <div className="form-group">
              <label><CheckCircle size={16} /> Heparin Total Dose</label>
              <input 
                type="text" 
                name="heparin_dose"
                value={formData.heparin_dose}
                onChange={handleInputChange}
                placeholder="e.g. 5000 units"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group full-width">
              <label>Medications Administered (During Session)</label>
              <textarea 
                name="medications_given"
                value={formData.medications_given}
                onChange={handleInputChange}
                placeholder="List medications, dosage, and time..."
                rows="2"
              ></textarea>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label><AlertCircle size={16} /> Any Complications?</label>
              <select 
                name="outcome"
                value={formData.outcome}
                onChange={handleInputChange}
                className="modal-select"
              >
                <option value="Optimal">None - Optimal Session</option>
                <option value="Stable">Stable with minor issues</option>
                <option value="BP Dip Observed">Hypotension (BP Dip)</option>
                <option value="Cramps Observed">Muscle Cramps</option>
                <option value="Nausea/Vomiting">Nausea / Vomiting</option>
                <option value="Bleeding">Excessive Bleeding</option>
                <option value="Critical">Critical Complication</option>
              </select>
            </div>
          </div>

          <div className="form-group full-width">
            <label>Additional Clinical Notes</label>
            <textarea 
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Detailed observations for the next shift..."
              rows="3"
            ></textarea>
          </div>
        </div>

        <footer className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn complete-btn" onClick={handleComplete} disabled={loading}>
            {loading ? 'Processing...' : (
              <>
                <Save size={18} />
                <span>Complete & Archive Session</span>
              </>
            )}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SessionReportModal;
