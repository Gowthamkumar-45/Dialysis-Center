import React, { useState, useEffect } from 'react';
import { X, Save, Settings, Tag, Hash, MapPin } from 'lucide-react';
import { machineService } from '../../services/api';
import './MachineModal.css';

const MachineModal = ({ isOpen, onClose, onRefresh, machine = null }) => {
  const [formData, setFormData] = useState({
    unit: 'kovai',
    brand: 'Fresenius',
    model: '4008 S',
    has_bpm: true,
    serial_number: '',
    type: 'Standard',
    status: 'In Use',
    installation_date: '',
    donated_by: '',
    warranty_years: 5,
    amc_from: '',
    amc_upto: '',
    running_hours: 0,
    remarks: '',
    last_service_date: '',
    uptime_percentage: 100
  });

  useEffect(() => {
    if (machine && isOpen) {
      setFormData({
        unit: machine.unit || 'kovai',
        brand: machine.brand || '',
        model: machine.model || '',
        has_bpm: machine.has_bpm ?? true,
        serial_number: machine.serial_number || '',
        type: machine.type || 'Standard',
        status: machine.status || 'In Use',
        installation_date: machine.installation_date || '',
        donated_by: machine.donated_by || '',
        warranty_years: machine.warranty_years || 5,
        amc_from: machine.amc_from || '',
        amc_upto: machine.amc_upto || '',
        running_hours: machine.running_hours || 0,
        remarks: machine.remarks || '',
        last_service_date: machine.last_service_date || '',
        uptime_percentage: machine.uptime_percentage || 100
      });
    } else if (!machine && isOpen) {
      setFormData({
        unit: 'kovai',
        brand: 'Fresenius',
        model: '4008 S',
        has_bpm: true,
        serial_number: '',
        type: 'Standard',
        status: 'In Use',
        installation_date: '',
        donated_by: '',
        warranty_years: 5,
        amc_from: '',
        amc_upto: '',
        running_hours: 0,
        remarks: '',
        last_service_date: '',
        uptime_percentage: 100
      });
    }
  }, [machine, isOpen]);

  const handleSave = async () => {
    try {
      // Basic validation
      if (!formData.unit || formData.unit === '') {
        alert('Please enter a Unit.');
        return;
      }

      const derivedUnitNumber =
        (machine && machine.unit_number) ||
        (formData.serial_number && formData.serial_number.trim()) ||
        `${formData.unit}-${Date.now()}`;

      const cleanedData = {
        ...formData,
        unit: formData.unit.toString(),
        unit_number: derivedUnitNumber,
        uptime_percentage: parseFloat(formData.uptime_percentage) || 100,
        warranty_years: formData.warranty_years === '' ? null : parseInt(formData.warranty_years, 10),
        running_hours: formData.running_hours === '' ? 0 : parseInt(formData.running_hours, 10),
        last_service_date: formData.last_service_date || null,
        amc_from: formData.amc_from || null,
        amc_upto: formData.amc_upto || null,
        installation_date: formData.installation_date || null
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
      <div className="modal-content animate-pop">
        <header className="modal-header">
          <h2>{machine ? 'Edit Unit' : 'New Dialysis Unit'}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="modal-body">
          <div className="form-grid">
              <div className="form-group">
                <label><MapPin size={16} /> Branch/Unit</label>
                <input
                  type="text"
                  name="unit"
                  value={formData.unit}
                  onChange={e => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g. kovai"
                />
              </div>
              <div className="form-group">
                <label><Tag size={16} /> Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={e => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g. Fresenius"
                />
              </div>
              <div className="form-group">
                <label><Settings size={16} /> Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={e => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g. 4008 S"
                />
              </div>
              <div className="form-group">
                <label><Hash size={16} /> Serial Number</label>
                <input
                  type="text"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={e => setFormData({ ...formData, serial_number: e.target.value })}
                  placeholder="Unique ID"
                />
              </div>

            <div className="form-group">
              <label>BPM Configuration</label>
              <select 
                value={formData.has_bpm}
                onChange={(e) => setFormData({...formData, has_bpm: e.target.value === 'true'})}
              >
                <option value="true">With BPM</option>
                <option value="false">Without BPM</option>
              </select>
            </div>

            <div className="form-group">
              <input 
                type="text" 
                value={formData.serial_number}
                onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                placeholder="e.g. 5SXA5YW1"
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
                <option value="HCV">HCV Dedicated Unit</option>
                <option value="HIV_HCV">HIV & HCV Dedicated Unit</option>
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
              <label>Installation Date</label>
              <input 
                type="date" 
                value={formData.installation_date}
                onChange={(e) => setFormData({...formData, installation_date: e.target.value})}
              />
            </div>

            <div className="form-group full-width">
              <label>Donated By</label>
              <input 
                type="text" 
                value={formData.donated_by}
                onChange={(e) => setFormData({...formData, donated_by: e.target.value})}
                placeholder="Organization or Trust name"
              />
            </div>

            <div className="form-group">
              <label>Warranty (Years)</label>
              <input 
                type="number" 
                value={formData.warranty_years}
                onChange={(e) => setFormData({...formData, warranty_years: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Running Hours</label>
              <input 
                type="number" 
                value={formData.running_hours}
                onChange={(e) => setFormData({...formData, running_hours: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>AMC From (Optional)</label>
              <input 
                type="date" 
                value={formData.amc_from}
                onChange={(e) => setFormData({...formData, amc_from: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>AMC Upto (Optional)</label>
              <input 
                type="date" 
                value={formData.amc_upto}
                onChange={(e) => setFormData({...formData, amc_upto: e.target.value})}
              />
            </div>

            <div className="form-group full-width">
              <label>Remarks</label>
              <textarea 
                value={formData.remarks}
                onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                placeholder="Additional notes..."
                rows="2"
              />
            </div>

            <div className="form-group full-width">
              <label>Uptime Performance ({formData.uptime_percentage}%)</label>
              <input 
                type="range" 
                min="0" 
                max="100"
                value={formData.uptime_percentage}
                onChange={(e) => setFormData({...formData, uptime_percentage: e.target.value})}
              />
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
