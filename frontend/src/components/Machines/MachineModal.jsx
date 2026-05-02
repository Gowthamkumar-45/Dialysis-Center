import React, { useState, useEffect } from 'react';
import { X, Save, Settings, AlertCircle, Activity } from 'lucide-react';
import { machineService } from '../../services/api';

const MachineModal = ({ isOpen, onClose, onRefresh, machine = null }) => {
  const [formData, setFormData] = useState({
    unit_number: '',
    type: 'Standard',
    status: 'In Use',
    last_service_date: '',
    uptime_percentage: 100
  });

  useEffect(() => {
    if (machine && isOpen) {
      setFormData({
        unit_number: machine.unit_number || '',
        type: machine.type || 'Standard',
        status: machine.status || 'Available',
        last_service_date: machine.last_service_date || '',
        uptime_percentage: machine.uptime_percentage || 100
      });
    } else if (!machine && isOpen) {
      setFormData({
        unit_number: '',
        type: 'Standard',
        status: 'In Use',
        last_service_date: '',
        uptime_percentage: 100
      });
    }
  }, [machine, isOpen]);

  const handleSave = async () => {
    try {
      // Basic validation
      if (!formData.unit_number || formData.unit_number === '') {
        alert('Please enter a Unit Number.');
        return;
      }

      const unitNum = parseInt(formData.unit_number);
      if (isNaN(unitNum)) {
        alert('Unit Number must be a valid number.');
        return;
      }

      const cleanedData = {
        ...formData,
        unit_number: unitNum,
        uptime_percentage: parseFloat(formData.uptime_percentage) || 100,
        last_service_date: formData.last_service_date || null
      };

      console.log('Sending machine data to API:', cleanedData);

      if (machine) {
        await machineService.update(machine.id, cleanedData);
      } else {
        await machineService.create(cleanedData);
      }
      onRefresh();
      onClose();
    } catch (error) {
      console.error('API Error details:', error.response?.data || error);
      let errorMsg = 'Please check your data and try again.';
      
      if (error.response?.data) {
        // Handle specific Django REST Framework validation errors
        errorMsg = Object.entries(error.response.data)
          .map(([key, value]) => {
            const fieldName = key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ');
            return `${fieldName}: ${Array.isArray(value) ? value.join(', ') : value}`;
          })
          .join('\n');
      }
      
      alert(`Failed to save machine.\n\n${errorMsg}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-pop" style={{ maxWidth: '500px' }}>
        <header className="modal-header">
          <h2>{machine ? 'Edit Unit' : 'New Dialysis Unit'}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="modal-body">
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="form-group">
              <label>Unit Number</label>
              <input 
                type="number" 
                value={formData.unit_number}
                onChange={(e) => setFormData({...formData, unit_number: e.target.value})}
                placeholder="e.g. 01"
              />
            </div>
            
            <div className="form-group">
              <label>Machine Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
              >
                <option value="Standard">Standard Unit</option>
                <option value="HIV">HIV Dedicated Unit</option>
              </select>
            </div>

            <div className="form-group">
              <label>Current Status</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="In Use">In Use</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Out of Service">Out of Service</option>
              </select>
            </div>

            <div className="form-group">
              <label>Date</label>
              <input 
                type="date" 
                value={formData.last_service_date}
                onChange={(e) => setFormData({...formData, last_service_date: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Uptime Performance (%)</label>
              <input 
                type="range" 
                min="0" 
                max="100"
                value={formData.uptime_percentage}
                onChange={(e) => setFormData({...formData, uptime_percentage: e.target.value})}
              />
              <div style={{ textAlign: 'right', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {formData.uptime_percentage}%
              </div>
            </div>
          </div>
        </div>

        <footer className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="save-btn" onClick={handleSave}>
            <Save size={18} />
            <span>{machine ? 'Update Unit' : 'Add Unit'}</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default MachineModal;
