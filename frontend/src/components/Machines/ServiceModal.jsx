import React, { useState, useEffect } from 'react';
import { X, Wrench, Calendar, User, ClipboardList, CheckCircle2 } from 'lucide-react';
import { serviceLogService } from '../../services/api';
import './ServiceModal.css';

const ServiceModal = ({ isOpen, onClose, machine, onUpdate }) => {
  const [formData, setFormData] = useState({
    last_service_date: new Date().toISOString().split('T')[0],
    technician: '',
    service_type: 'Routine',
    notes: '',
    next_service_due: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && machine) {
      setFormData(prev => ({
        ...prev,
        last_service_date: machine.last_service_date || new Date().toISOString().split('T')[0]
      }));
      setSuccess(false);
    }
  }, [isOpen, machine]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create a service log entry
      await serviceLogService.create({
        machine: machine.id,
        service_date: formData.last_service_date,
        service_type: formData.service_type,
        technician: formData.technician,
        notes: formData.notes
      });

      // 2. Update the machine's last_service_date
      await onUpdate(machine.id, {
        last_service_date: formData.last_service_date
      });

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error updating service status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="service-modal-overlay">
      <div className={`service-modal-content animate-pop ${success ? 'success-mode' : ''}`}>
        {!success ? (
          <>
            <header className="service-header">
              <div className="header-title">
                <div className="icon-badge">
                  <Wrench size={20} />
                </div>
                <div>
                  <h2>Service Update</h2>
                  <p>Unit: {machine?.unit_number}</p>
                </div>
              </div>
              <button className="close-btn" onClick={onClose}><X size={20} /></button>
            </header>

            <form onSubmit={handleSubmit} className="service-form">
              <div className="form-grid">
                <div className="form-group">
                  <label><Calendar size={16} /> Service Date</label>
                  <input
                    type="date"
                    required
                    value={formData.last_service_date}
                    onChange={(e) => setFormData({ ...formData, last_service_date: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label><ClipboardList size={16} /> Service Type</label>
                  <select
                    value={formData.service_type}
                    onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                  >
                    <option value="Routine">Routine Maintenance</option>
                    <option value="Repair">Part Repair</option>
                    <option value="Emergency">Emergency Fix</option>
                    <option value="Calibration">Calibration</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label><User size={16} /> Technician Name</label>
                  <input
                    type="text"
                    placeholder="Enter technician name..."
                    value={formData.technician}
                    onChange={(e) => setFormData({ ...formData, technician: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label><ClipboardList size={16} /> Maintenance Notes</label>
                  <textarea
                    placeholder="Describe service actions taken..."
                    rows="4"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? 'Updating...' : 'Confirm Service Update'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="success-state animate-fade-in">
            <div className="success-icon-ring">
              <CheckCircle2 size={48} />
            </div>
            <h3>Update Successful</h3>
            <p>Service records for Unit {machine?.unit_number} have been updated.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceModal;
