import React, { useState } from 'react';
import { X, Save, Calendar, ChevronDown } from 'lucide-react';
import { patientService } from '../../services/api';
import './PatientModal.css';

const PatientModal = ({ isOpen, onClose, onRefresh, patient = null }) => {
  const [activeTab, setActiveTab] = useState('Identity');
  const [formData, setFormData] = useState({
    patient_id: '',
    full_name: '',
    relation_type: '',
    relation_name: '',
    date_of_birth: '',
    age: '',
    gender: 'M',
    blood_group: '',
    phone: '',
    email: '',
    address: '',
    permanent_address: '',
    education: '',
    occupation_past: '',
    occupation_present: '',
    income_source: '',
    dialysis_supported_by: '',
    supporting_person_income: '',
    marital_status: '',
    family_constellation: '',
    primary_diagnosis: '',
    diabetes: false,
    hypertension: false,
    ckd_stage_v: false,
    others_diagnosis: '',
    av_fistula_created_on: '',
    dialysis_commenced_on: '',
    past_medical_history: '',
    hiv_status: false,
    hepatitis_b: false,
    hepatitis_c: false,
    usg_abdomen: '',
    echo: '',
    urea: '',
    creatinine: '',
    haemoglobin: '',
    electrolytes: '',
    blood_pressure: '',
    current_weight: '',
    dry_weight: '',
    pulse: '',
    temperature: '',
    vascular_access: '',
    dialysis_frequency: 'Three times a week',
    allergies: '',
    clinical_alerts: '',
    contact_person_1_name: '',
    contact_person_1_phone: '',
    contact_person_2_name: '',
    contact_person_2_phone: '',
    contact_person_3_name: '',
    contact_person_3_phone: '',
    registration_date: '',
    registration_done_by: '',
    unit_name: '',
    has_aadhar: false,
    has_ration: false,
    has_cmchis: false,
    status: 'Active',
    notes: ''
  });

  React.useEffect(() => {
    if (patient && isOpen) {
      const safePatient = {};
      Object.keys(patient).forEach(key => {
        safePatient[key] = patient[key] === null ? '' : patient[key];
      });

      setFormData({
        ...formData, // default base
        ...safePatient,
        gender: patient.gender ? patient.gender.charAt(0).toUpperCase() : '',
        hiv_status: patient.hiv_status || false,
        hepatitis_b: patient.hepatitis_b || false,
        hepatitis_c: patient.hepatitis_c || false,
        diabetes: patient.diabetes || false,
        hypertension: patient.hypertension || false,
        ckd_stage_v: patient.ckd_stage_v || false,
        has_aadhar: patient.has_aadhar || false,
        has_ration: patient.has_ration || false,
        has_cmchis: patient.has_cmchis || false,
        blood_pressure: patient.blood_pressure || (patient.vitals?.bp || ''),
        current_weight: patient.current_weight || (patient.vitals?.weight || ''),
        pulse: patient.pulse || (patient.vitals?.pulse || ''),
        temperature: patient.temperature || (patient.vitals?.temp || '')
      });
    } else if (!patient && isOpen) {
      setFormData({
        patient_id: '', full_name: '', relation_type: '', relation_name: '',
        date_of_birth: '', age: '', gender: 'M', blood_group: '', phone: '',
        email: '', address: '', permanent_address: '', education: '',
        occupation_past: '', occupation_present: '', income_source: '',
        dialysis_supported_by: '', supporting_person_income: '', marital_status: '',
        family_constellation: '', primary_diagnosis: '', diabetes: false,
        hypertension: false, ckd_stage_v: false, others_diagnosis: '',
        av_fistula_created_on: '', dialysis_commenced_on: '', past_medical_history: '',
        hiv_status: false, hepatitis_b: false, hepatitis_c: false, usg_abdomen: '',
        echo: '', urea: '', creatinine: '', haemoglobin: '', electrolytes: '',
        blood_pressure: '', current_weight: '', dry_weight: '', pulse: '',
        temperature: '', vascular_access: '', dialysis_frequency: 'Three times a week',
        allergies: '', clinical_alerts: '', contact_person_1_name: '',
        contact_person_1_phone: '', contact_person_2_name: '', contact_person_2_phone: '',
        contact_person_3_name: '', contact_person_3_phone: '', registration_date: '',
        registration_done_by: '', unit_name: '', has_aadhar: false, has_ration: false,
        has_cmchis: false, status: 'Active', notes: ''
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
      const rawData = { ...formData };
      const validFields = Object.keys(formData); // Using all form data keys
      const cleanedData = {};
      validFields.forEach(field => {
        if (rawData[field] !== undefined) cleanedData[field] = rawData[field];
      });
      
      const numericFields = ['age', 'dry_weight', 'current_weight', 'pulse', 'temperature'];
      numericFields.forEach(field => {
        if (cleanedData[field] === '' || cleanedData[field] === null || cleanedData[field] === undefined) {
          cleanedData[field] = null;
        } else {
          const val = Number(cleanedData[field]);
          cleanedData[field] = isNaN(val) ? null : val;
        }
      });

      const dateFields = ['date_of_birth', 'av_fistula_created_on', 'dialysis_commenced_on', 'registration_date'];
      dateFields.forEach(field => {
        if (!cleanedData[field]) cleanedData[field] = null;
      });

      const booleanFields = ['hiv_status', 'hepatitis_b', 'hepatitis_c', 'diabetes', 'hypertension', 'ckd_stage_v', 'has_aadhar', 'has_ration', 'has_cmchis'];
      booleanFields.forEach(field => {
        const val = String(cleanedData[field]);
        cleanedData[field] = (val === 'true' || cleanedData[field] === true);
      });

      if (patient && patient.id) {
        await patientService.update(patient.id, cleanedData);
      } else {
        await patientService.create(cleanedData);
      }
      onRefresh();
      onClose();
    } catch (error) {
      console.error('API Error Response:', error.response?.data);
      alert('Failed to save patient. Please check your data.');
    }
  };

  if (!isOpen) return null;

  const tabs = ['Identity', 'Socio-Economic', 'Medical', 'Registration'];

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-pop">
        <header className="modal-header">
          <h2>{patient ? 'Edit Registration Form' : 'New Registration Form'}</h2>
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
          {activeTab === 'Identity' && (
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Name</label>
                <input type="text" name="full_name" value={formData.full_name} onChange={handleInputChange} />
              </div>
              <div className="form-group full-width">
                <label>S/O, D/O, H/O, W/O</label>
                <div className="input-group" style={{ display: 'flex', gap: '8px' }}>
                  <select name="relation_type" value={formData.relation_type} onChange={handleInputChange} style={{ width: '100px' }}>
                    <option value="">Select</option>
                    <option value="S/O">S/O</option>
                    <option value="D/O">D/O</option>
                    <option value="H/O">H/O</option>
                    <option value="W/O">W/O</option>
                  </select>
                  <input type="text" name="relation_name" value={formData.relation_name} onChange={handleInputChange} style={{ flex: 1 }} />
                </div>
              </div>
              
              <div className="form-group">
                <label>Date of Birth</label>
                <input type="date" name="date_of_birth" value={formData.date_of_birth || ''} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Blood Group</label>
                <select name="blood_group" value={formData.blood_group} onChange={handleInputChange}>
                  <option value="">Select</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
              <div className="form-group">
                <label>Age</label>
                <input type="number" name="age" value={formData.age} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Sex</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange}>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>Present Address</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2"></textarea>
              </div>
              <div className="form-group full-width">
                <label>Permanent Address</label>
                <textarea name="permanent_address" value={formData.permanent_address} onChange={handleInputChange} rows="2"></textarea>
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Email ID</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
              </div>
            </div>
          )}

          {activeTab === 'Socio-Economic' && (
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Education Qualification</label>
                <input type="text" name="education" value={formData.education} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Occupation Past</label>
                <input type="text" name="occupation_past" value={formData.occupation_past} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Occupation Present</label>
                <input type="text" name="occupation_present" value={formData.occupation_present} onChange={handleInputChange} />
              </div>
              <div className="form-group full-width">
                <label>Salary or Pension or Unemployed</label>
                <input type="text" name="income_source" value={formData.income_source} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Dialysis Supported By</label>
                <input type="text" name="dialysis_supported_by" value={formData.dialysis_supported_by} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Supporting Person's Income</label>
                <input type="text" name="supporting_person_income" value={formData.supporting_person_income} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Marital Status</label>
                <input type="text" name="marital_status" value={formData.marital_status} onChange={handleInputChange} />
              </div>
              <div className="form-group full-width">
                <label>Family Constellation</label>
                <textarea name="family_constellation" value={formData.family_constellation} onChange={handleInputChange} rows="3"></textarea>
              </div>
            </div>
          )}

          {activeTab === 'Medical' && (
            <div className="form-grid">
              <div className="section-title full-width" style={{ marginTop: 0 }}>Diagnosis & History</div>
              <div className="form-group full-width">
                <label>Diagnosis</label>
                <input type="text" name="primary_diagnosis" value={formData.primary_diagnosis} onChange={handleInputChange} />
              </div>
              
              <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" name="diabetes" checked={formData.diabetes} onChange={handleInputChange} style={{ width: 'auto' }} />
                <label style={{ margin: 0 }}>Diabetes</label>
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" name="hypertension" checked={formData.hypertension} onChange={handleInputChange} style={{ width: 'auto' }} />
                <label style={{ margin: 0 }}>Hypertension</label>
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" name="ckd_stage_v" checked={formData.ckd_stage_v} onChange={handleInputChange} style={{ width: 'auto' }} />
                <label style={{ margin: 0 }}>CKD Stage V</label>
              </div>
              <div className="form-group">
                <label>Others</label>
                <input type="text" name="others_diagnosis" value={formData.others_diagnosis} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label>AV Fistula Created On</label>
                <input type="date" name="av_fistula_created_on" value={formData.av_fistula_created_on || ''} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Dialysis Commenced On</label>
                <input type="date" name="dialysis_commenced_on" value={formData.dialysis_commenced_on || ''} onChange={handleInputChange} />
              </div>
              <div className="form-group full-width">
                <label>Past Medical History</label>
                <textarea name="past_medical_history" value={formData.past_medical_history} onChange={handleInputChange} rows="2"></textarea>
              </div>

              <div className="section-title full-width">Scheme Patient Investigations</div>
              <div className="form-group">
                <label>USG Abdomen</label>
                <input type="text" name="usg_abdomen" value={formData.usg_abdomen} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Echo</label>
                <input type="text" name="echo" value={formData.echo} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Urea</label>
                <input type="text" name="urea" value={formData.urea} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Creatinine</label>
                <input type="text" name="creatinine" value={formData.creatinine} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Haemoglobin</label>
                <input type="text" name="haemoglobin" value={formData.haemoglobin} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Electrolytes</label>
                <input type="text" name="electrolytes" value={formData.electrolytes} onChange={handleInputChange} />
              </div>
              
              <div className="form-group">
                <label>HIV Status</label>
                <select name="hiv_status" value={formData.hiv_status} onChange={handleInputChange}>
                  <option value={false}>Negative</option>
                  <option value={true}>Positive</option>
                </select>
              </div>
              <div className="form-group">
                <label>HCV (Hepatitis C)</label>
                <select name="hepatitis_c" value={formData.hepatitis_c} onChange={handleInputChange}>
                  <option value={false}>Negative</option>
                  <option value={true}>Positive</option>
                </select>
              </div>
              <div className="form-group">
                <label>HBsAg (Hepatitis B)</label>
                <select name="hepatitis_b" value={formData.hepatitis_b} onChange={handleInputChange}>
                  <option value={false}>Negative</option>
                  <option value={true}>Positive</option>
                </select>
              </div>

              <div className="section-title full-width">Dialysis Specifications</div>
              <div className="form-group">
                <label>Dialysis Frequency</label>
                <select name="dialysis_frequency" value={formData.dialysis_frequency} onChange={handleInputChange}>
                  <option value="Three times a week">Three times a week</option>
                  <option value="Two times a week">Two times a week</option>
                  <option value="Once a week">Once a week</option>
                  <option value="Daily">Daily</option>
                </select>
              </div>
              <div className="form-group">
                <label>Dry Weight (kg)</label>
                <input type="number" name="dry_weight" value={formData.dry_weight} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Vascular Access</label>
                <input type="text" name="vascular_access" value={formData.vascular_access} onChange={handleInputChange} />
              </div>
            </div>
          )}

          {activeTab === 'Registration' && (
            <div className="form-grid">
              <div className="section-title full-width" style={{ marginTop: 0 }}>Contact Person Name and Telephone Number</div>
              <div className="form-group">
                <label>Name 1</label>
                <input type="text" name="contact_person_1_name" value={formData.contact_person_1_name} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Number 1</label>
                <input type="text" name="contact_person_1_phone" value={formData.contact_person_1_phone} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Name 2</label>
                <input type="text" name="contact_person_2_name" value={formData.contact_person_2_name} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Number 2</label>
                <input type="text" name="contact_person_2_phone" value={formData.contact_person_2_phone} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Name 3</label>
                <input type="text" name="contact_person_3_name" value={formData.contact_person_3_name} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Number 3</label>
                <input type="text" name="contact_person_3_phone" value={formData.contact_person_3_phone} onChange={handleInputChange} />
              </div>

              <div className="section-title full-width">Patient's Commitments</div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" name="has_aadhar" checked={formData.has_aadhar} onChange={handleInputChange} style={{ width: 'auto' }} />
                <label style={{ margin: 0 }}>Aadhar Card: Yes</label>
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" name="has_ration" checked={formData.has_ration} onChange={handleInputChange} style={{ width: 'auto' }} />
                <label style={{ margin: 0 }}>Ration Card: Yes</label>
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" name="has_cmchis" checked={formData.has_cmchis} onChange={handleInputChange} style={{ width: 'auto' }} />
                <label style={{ margin: 0 }}>CMCHIS Card: Yes</label>
              </div>

              <div className="section-title full-width">System Details</div>
              <div className="form-group">
                <label>Date of Registration</label>
                <input type="date" name="registration_date" value={formData.registration_date || ''} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Registration Done By</label>
                <input type="text" name="registration_done_by" value={formData.registration_done_by} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Unit Name</label>
                <input type="text" name="unit_name" value={formData.unit_name} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Patient ID (System)</label>
                <input type="text" name="patient_id" value={formData.patient_id} onChange={handleInputChange} />
              </div>
              <div className="form-group full-width">
                <label>System Status</label>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Deceased">Deceased</option>
                </select>
              </div>
              <div className="form-group full-width">
                <label>Documentation & Notes (e.g., Consent Form)</label>
                <textarea 
                  name="notes" 
                  value={formData.notes} 
                  onChange={handleInputChange} 
                  rows="3"
                  placeholder="Enter consent details or general clinical notes here..."
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
            <span>Save Registration Form</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PatientModal;
