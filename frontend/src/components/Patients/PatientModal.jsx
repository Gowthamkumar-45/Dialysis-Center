import React, { useState } from 'react';
import { X, Save, Calendar, ChevronDown } from 'lucide-react';
import { patientService } from '../../services/api';
import './PatientModal.css';

const PatientModal = ({ isOpen, onClose, onRefresh, patient = null }) => {
  const [activeTab, setActiveTab] = useState('Personal');
  const [formData, setFormData] = useState({
    patient_id: '',
    full_name: '',
    date_of_birth: '',
    gender: 'M',
    phone: '',
    email: '',
    address: '',
    blood_group: '',
    hiv_status: '',
    hepatitis_b: '',
    hepatitis_c: '',
    diabetes: '',
    hypertension: '',
    primary_diagnosis: '',
    dialysis_frequency: 'Three times a week',
    dry_weight: '',
    status: 'Active',
    emergency_contact: '',
    emergency_phone: '',
    insurance_provider: '',
    insurance_id: '',
    notes: '',
    vascular_access: '',
    allergies: '',
    clinical_alerts: '',
    age: '',
    blood_pressure: '',
    current_weight: '',
    pulse: '',
    temperature: ''
  });

  React.useEffect(() => {
    if (patient && isOpen) {
      setFormData({
        ...patient,
        // Ensure values aren't null for inputs
        patient_id: patient.patient_id || '',
        full_name: patient.full_name || '',
        date_of_birth: patient.date_of_birth || '',
        gender: patient.gender ? patient.gender.charAt(0).toUpperCase() : '',
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
        blood_group: patient.blood_group || '',
        hiv_status: patient.hiv_status !== undefined ? String(patient.hiv_status) : '',
        hepatitis_b: patient.hepatitis_b !== undefined ? String(patient.hepatitis_b) : '',
        hepatitis_c: patient.hepatitis_c !== undefined ? String(patient.hepatitis_c) : '',
        diabetes: patient.diabetes !== undefined ? String(patient.diabetes) : '',
        hypertension: patient.hypertension !== undefined ? String(patient.hypertension) : '',
        primary_diagnosis: patient.primary_diagnosis || '',
        dialysis_frequency: patient.dialysis_frequency || 'Three times a week',
        dry_weight: patient.dry_weight || '',
        status: patient.status || 'Active',
        emergency_contact: patient.emergency_contact || '',
        emergency_phone: patient.emergency_phone || '',
        insurance_provider: patient.insurance_provider || '',
        insurance_id: patient.insurance_id || '',
        notes: patient.notes || '',
        vascular_access: patient.vascular_access || '',
        allergies: patient.allergies || '',
        clinical_alerts: patient.clinical_alerts || '',
        age: patient.age || '',
        blood_pressure: patient.blood_pressure || (patient.vitals?.bp || ''),
        current_weight: patient.current_weight || (patient.vitals?.weight || ''),
        pulse: patient.pulse || (patient.vitals?.pulse || ''),
        temperature: patient.temperature || (patient.vitals?.temp || '')
      });
    } else if (!patient && isOpen) {
      // Reset for new patient
      setFormData({
        patient_id: '',
        full_name: '',
        date_of_birth: '',
        gender: 'M',
        phone: '',
        email: '',
        address: '',
        blood_group: '',
        hiv_status: '',
        hepatitis_b: '',
        hepatitis_c: '',
        diabetes: '',
        hypertension: '',
        primary_diagnosis: '',
        dialysis_frequency: 'Three times a week',
        dry_weight: '',
        status: 'Active',
        emergency_contact: '',
        emergency_phone: '',
        insurance_provider: '',
        insurance_id: '',
        notes: '',
        age: '',
        blood_pressure: '',
        current_weight: '',
        pulse: '',
        temperature: ''
      });
    }
  }, [patient, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async () => {
    try {
      // Clean and format data for backend
      const rawData = { ...formData };
      
      // 1. Define fields that exist in the Backend Model
      const validFields = [
        'patient_id', 'full_name', 'date_of_birth', 'gender', 'phone', 
        'email', 'address', 'blood_group', 'hiv_status', 'hepatitis_b', 
        'hepatitis_c', 'diabetes', 'hypertension', 'primary_diagnosis', 
        'dialysis_frequency', 'dry_weight', 'status', 'age', 
        'blood_pressure', 'current_weight', 'pulse', 'temperature', 
        'emergency_contact', 'emergency_phone', 'insurance_provider', 
        'insurance_id', 'notes', 'vascular_access', 
        'allergies', 'clinical_alerts'
      ];

      // 2. Create cleaned object with ONLY valid fields
      const cleanedData = {};
      validFields.forEach(field => {
        if (rawData[field] !== undefined) {
          cleanedData[field] = rawData[field];
        }
      });
      
      // 3. Format numeric fields
      const numericFields = ['age', 'dry_weight', 'current_weight', 'pulse', 'temperature'];
      numericFields.forEach(field => {
        if (cleanedData[field] === '' || cleanedData[field] === null || cleanedData[field] === undefined) {
          cleanedData[field] = null;
        } else {
          const val = Number(cleanedData[field]);
          cleanedData[field] = isNaN(val) ? null : val;
        }
      });

      // 4. Handle date
      if (!cleanedData.date_of_birth) {
        cleanedData.date_of_birth = null;
      }

      // 5. Convert boolean strings to actual booleans
      const booleanFields = ['hiv_status', 'hepatitis_b', 'hepatitis_c', 'diabetes', 'hypertension'];
      booleanFields.forEach(field => {
        const val = String(cleanedData[field]);
        if (val === 'true' || cleanedData[field] === true) {
          cleanedData[field] = true;
        } else if (val === 'false' || cleanedData[field] === false) {
          cleanedData[field] = false;
        } else {
          cleanedData[field] = false; 
        }
      });

      console.log('CLEANED DATA for API:', cleanedData);

      if (patient && patient.id) {
        await patientService.update(patient.id, cleanedData);
      } else {
        await patientService.create(cleanedData);
      }
      onRefresh();
      onClose();
    } catch (error) {
      console.error('API Error Response:', error.response?.data);
      let errorMsg = 'Please check your data and try again.';
      
      if (error.response?.data) {
        if (typeof error.response.data === 'object') {
          errorMsg = Object.entries(error.response.data)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join('\n');
        } else {
          errorMsg = String(error.response.data);
        }
      }
      
      alert(`Failed to save patient.\n\n${errorMsg}`);
    }
  };

  if (!isOpen) return null;

  const tabs = ['Personal', 'Medical', 'Dialysis', 'Other'];

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-pop">
        <header className="modal-header">
          <h2>{patient ? 'Edit Patient' : 'New Patient'}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </header>

        <div className="modal-tabs">
          {tabs.map(tab => (
            <button 
              key={tab} 
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="modal-body">
          {activeTab === 'Personal' && (
            <div className="form-grid">
              <div className="form-group">
                <label>Patient ID <span className="req">*</span></label>
                <input 
                  type="text" 
                  name="patient_id"
                  value={formData.patient_id}
                  onChange={handleInputChange}
                  placeholder="Enter patient ID" 
                />
              </div>
              <div className="form-group">
                <label>Full Name <span className="req">*</span></label>
                <input 
                  type="text" 
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  placeholder="Enter full name" 
                />
              </div>
              <div className="form-group">
                <label>Date of Birth</label>
                <div className="input-with-icon">
                  <input 
                    type="date" 
                    name="date_of_birth"
                    id="dob-input"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                  />
                  <Calendar 
                    size={18} 
                    className="inner-icon" 
                    style={{ cursor: 'pointer' }}
                    onClick={() => document.getElementById('dob-input').showPicker()}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Age</label>
                <input 
                  type="number" 
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="Enter age" 
                />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <div className="input-with-icon">
                  <select 
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                  >
                    <option value="">Select gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                  <ChevronDown size={18} className="inner-icon" />
                </div>
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input 
                  type="text" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number" 
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address" 
                />
              </div>
              <div className="form-group full-width">
                <label>Address</label>
                <textarea 
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter full address" 
                  rows="3"
                ></textarea>
              </div>
            </div>
          )}

          {activeTab === 'Medical' && (
            <div className="form-grid">
              <div className="form-group">
                <label>Blood Group <span className="req">*</span></label>
                <div className="input-with-icon">
                  <select 
                    name="blood_group"
                    value={formData.blood_group}
                    onChange={handleInputChange}
                  >
                    <option value="">Select blood group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                  <ChevronDown size={18} className="inner-icon" />
                </div>
              </div>
              <div className="form-group">
                <label>HIV Status <span className="req">*</span></label>
                <div className="input-with-icon">
                  <select 
                    name="hiv_status"
                    value={formData.hiv_status}
                    onChange={handleInputChange}
                  >
                    <option value="" disabled hidden>Select status</option>
                    <option value="false">Negative</option>
                    <option value="true">Positive</option>
                  </select>
                  <ChevronDown size={18} className="inner-icon" />
                </div>
              </div>
              <div className="form-group">
                <label>Hepatitis B</label>
                <div className="input-with-icon">
                  <select 
                    name="hepatitis_b"
                    value={formData.hepatitis_b}
                    onChange={handleInputChange}
                  >
                    <option value="" disabled hidden>Select status</option>
                    <option value="false">Negative</option>
                    <option value="true">Positive</option>
                  </select>
                  <ChevronDown size={18} className="inner-icon" />
                </div>
              </div>
              <div className="form-group">
                <label>Hepatitis C</label>
                <div className="input-with-icon">
                  <select 
                    name="hepatitis_c"
                    value={formData.hepatitis_c}
                    onChange={handleInputChange}
                  >
                    <option value="" disabled hidden>Select status</option>
                    <option value="false">Negative</option>
                    <option value="true">Positive</option>
                  </select>
                  <ChevronDown size={18} className="inner-icon" />
                </div>
              </div>
              <div className="form-group">
                <label>Diabetes</label>
                <div className="input-with-icon">
                  <select 
                    name="diabetes"
                    value={formData.diabetes}
                    onChange={handleInputChange}
                  >
                    <option value="" disabled hidden>Select option</option>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                  <ChevronDown size={18} className="inner-icon" />
                </div>
              </div>
              <div className="form-group">
                <label>Hypertension</label>
                <div className="input-with-icon">
                  <select 
                    name="hypertension"
                    value={formData.hypertension}
                    onChange={handleInputChange}
                  >
                    <option value="" disabled hidden>Select option</option>
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                  <ChevronDown size={18} className="inner-icon" />
                </div>
              </div>
              <div className="form-group">
                <label>Blood Pressure (mmHg)</label>
                <input 
                  type="text" 
                  name="blood_pressure"
                  value={formData.blood_pressure}
                  onChange={handleInputChange}
                  placeholder="e.g. 120/80" 
                />
              </div>
              <div className="form-group">
                <label>Weight (kg)</label>
                <input 
                  type="number" 
                  name="current_weight"
                  value={formData.current_weight}
                  onChange={handleInputChange}
                  placeholder="0.0" 
                />
              </div>
              <div className="form-group">
                <label>Avg Pulse (bpm)</label>
                <input 
                  type="number" 
                  name="pulse"
                  value={formData.pulse}
                  onChange={handleInputChange}
                  placeholder="70" 
                />
              </div>
              <div className="form-group">
                <label>Temperature (°C)</label>
                <input 
                  type="number" 
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleInputChange}
                  placeholder="36.5" 
                  step="0.1"
                />
              </div>
              <div className="form-group full-width">
                <label>Primary Diagnosis</label>
                <input 
                  type="text" 
                  name="primary_diagnosis"
                  value={formData.primary_diagnosis}
                  onChange={handleInputChange}
                  placeholder="Enter diagnosis" 
                />
              </div>
              <div className="form-group">
                <label>Vascular Access</label>
                <input 
                  type="text" 
                  name="vascular_access"
                  value={formData.vascular_access}
                  onChange={handleInputChange}
                  placeholder="e.g. Arm AV Fistula" 
                />
              </div>
              <div className="form-group full-width">
                <label>Allergies (Critical)</label>
                <textarea 
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  placeholder="List any allergies (e.g. Penicillin)" 
                  rows="2"
                ></textarea>
              </div>
              <div className="form-group full-width">
                <label>Clinical Alerts / Restrictions</label>
                <textarea 
                  name="clinical_alerts"
                  value={formData.clinical_alerts}
                  onChange={handleInputChange}
                  placeholder="e.g. Fluid Restriction: 1.2L daily" 
                  rows="2"
                ></textarea>
              </div>
            </div>
          )}

          {activeTab === 'Dialysis' && (
            <div className="form-grid">
              <div className="form-group">
                <label>Dialysis Frequency</label>
                <div className="input-with-icon">
                  <select 
                    name="dialysis_frequency"
                    value={formData.dialysis_frequency}
                    onChange={handleInputChange}
                  >
                    <option value="Three times a week">Three times a week</option>
                    <option value="Two times a week">Two times a week</option>
                    <option value="Once a week">Once a week</option>
                    <option value="Daily">Daily</option>
                  </select>
                  <ChevronDown size={18} className="inner-icon" />
                </div>
              </div>
              <div className="form-group">
                <label>Dry Weight (kg)</label>
                <input 
                  type="number" 
                  name="dry_weight"
                  value={formData.dry_weight}
                  onChange={handleInputChange}
                  placeholder="0.0" 
                />
              </div>
              <div className="form-group full-width">
                <label>Status <span className="req">*</span></label>
                <div className="input-with-icon">
                  <select 
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Transferred">Transferred</option>
                    <option value="Deceased">Deceased</option>
                  </select>
                  <ChevronDown size={18} className="inner-icon" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Other' && (
            <div className="form-grid">
              <div className="form-group">
                <label>Emergency Contact</label>
                <input 
                  type="text" 
                  name="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={handleInputChange}
                  placeholder="Name" 
                />
              </div>
              <div className="form-group">
                <label>Emergency Phone</label>
                <input 
                  type="text" 
                  name="emergency_phone"
                  value={formData.emergency_phone}
                  onChange={handleInputChange}
                  placeholder="Phone" 
                />
              </div>
              <div className="form-group">
                <label>Insurance Provider</label>
                <input 
                  type="text" 
                  name="insurance_provider"
                  value={formData.insurance_provider}
                  onChange={handleInputChange}
                  placeholder="Provider name" 
                />
              </div>
              <div className="form-group">
                <label>Insurance ID</label>
                <input 
                  type="text" 
                  name="insurance_id"
                  value={formData.insurance_id}
                  onChange={handleInputChange}
                  placeholder="ID number" 
                />
              </div>
              <div className="form-group full-width">
                <label>Notes</label>
                <textarea 
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional notes" 
                  rows="4"
                ></textarea>
              </div>
            </div>
          )}
        </div>

        <footer className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            <X size={18} />
            <span>Cancel</span>
          </button>
          <button className="save-btn" onClick={handleSave}>
            <Save size={18} />
            <span>Save Patient</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PatientModal;
