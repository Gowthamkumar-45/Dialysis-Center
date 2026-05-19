import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Save, Camera, RotateCcw, Scan, Upload, AlertCircle, User, Users, Calendar, Hash, Phone, Mail, MapPin, Briefcase, GraduationCap, DollarSign, Droplet, ChevronRight } from 'lucide-react';
import { patientService, getFullImageUrl } from '../../services/api';
import './PatientModal.css';

const PatientModal = ({ isOpen, onClose, onRefresh, patient = null }) => {
  const othersInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [activeTab, setActiveTab] = useState('Identity');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [liveStream, setLiveStream] = useState(null); // triggers video srcObject effect
  const [formData, setFormData] = useState({
    patient_id: '',
    first_name: '',
    last_name: '',
    relation_type: '',
    relation_name: '',
    date_of_birth: '',
    age: '',
    gender: '',
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
    sgot: '',
    sgpt: '',
    blood_pressure: '',
    current_weight: '',
    dry_weight: '',
    pulse: '',
    temperature: '',
    vascular_access: '',
    dialysis_frequency: '',
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
    unit_name: 'kovai',
    has_aadhar: false,
    aadhar_number: '',
    aadhar_proof: null,
    has_ration: false,
    ration_number: '',
    ration_proof: null,
    has_cmchis: false,
    cmchis_number: '',
    cmchis_proof: null,
    status: 'Active',
    status_remarks: '',
    notes: '',
    isOthersActive: false,
    patient_photo: null,
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
        first_name: patient.full_name ? patient.full_name.split(' ')[0] : '',
        last_name: patient.full_name ? patient.full_name.split(' ').slice(1).join(' ') : '',
        gender: patient.gender ? patient.gender.charAt(0).toUpperCase() : '',
        hiv_status: patient.hiv_status || false,
        hepatitis_b: patient.hepatitis_b || false,
        hepatitis_c: patient.hepatitis_c || false,
        diabetes: patient.diabetes || false,
        hypertension: patient.hypertension || false,
        ckd_stage_v: patient.ckd_stage_v || false,
        has_aadhar: patient.has_aadhar || false,
        aadhar_number: patient.aadhar_number || '',
        has_ration: patient.has_ration || false,
        ration_number: patient.ration_number || '',
        has_cmchis: patient.has_cmchis || false,
        cmchis_number: patient.cmchis_number || '',
        blood_pressure: patient.blood_pressure || (patient.vitals?.bp || ''),
        current_weight: patient.current_weight || (patient.vitals?.weight || ''),
        pulse: patient.pulse || (patient.vitals?.pulse || ''),
        temperature: patient.temperature || (patient.vitals?.temp || ''),
        isOthersActive: !!patient.others_diagnosis
      });
      if (patient.patient_photo) {
        setCapturedPhoto(patient.patient_photo);
      }
    } else if (!patient && isOpen) {
      setFormData({
        patient_id: '', first_name: '', last_name: '', relation_type: '', relation_name: '',
        date_of_birth: '', age: '', gender: '', blood_group: '', phone: '',
        email: '', address: '', permanent_address: '', education: '',
        occupation_past: '', occupation_present: '', income_source: '',
        dialysis_supported_by: '', supporting_person_income: '', marital_status: '',
        family_constellation: '', primary_diagnosis: '', diabetes: false,
        hypertension: false, ckd_stage_v: false, others_diagnosis: '',
        av_fistula_created_on: '', dialysis_commenced_on: '', past_medical_history: '',
        hiv_status: false, hepatitis_b: false, hepatitis_c: false, usg_abdomen: '',
        echo: '', urea: '', creatinine: '', haemoglobin: '', electrolytes: '',
        blood_pressure: '', current_weight: '', dry_weight: '', pulse: '',
        temperature: '', vascular_access: '', dialysis_frequency: '',
        allergies: '', clinical_alerts: '', contact_person_1_name: '',
        contact_person_1_phone: '', contact_person_2_name: '', contact_person_2_phone: '',
        contact_person_3_name: '', contact_person_3_phone: '', registration_date: '',
        registration_done_by: '', unit_name: 'kovai', 
        has_aadhar: false, aadhar_number: '', aadhar_proof: null,
        has_ration: false, ration_number: '', ration_proof: null,
        has_cmchis: false, cmchis_number: '', cmchis_proof: null,
        status: 'Active', notes: '', isOthersActive: false
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient, isOpen]);
  
  // ── Camera helpers ──────────────────────────────────────────────
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setLiveStream(null);
    }
  }, []);

  const openCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      streamRef.current = stream;
      setLiveStream(stream);   // triggers the useEffect below to assign srcObject
      setCameraActive(true);
      setCapturedPhoto(null);
    } catch (err) {
      console.error('Camera error:', err);
      alert('Could not access camera. Please allow camera permission in your browser.');
    }
  }, []);

  // Assign stream to video element AFTER it is rendered in the DOM
  useEffect(() => {
    if (liveStream && videoRef.current) {
      videoRef.current.srcObject = liveStream;
      videoRef.current.play().catch(e => console.warn('Video play error:', e));
    }
  }, [liveStream, cameraActive]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(dataUrl);
    canvas.toBlob(blob => {
      const file = new File([blob], 'patient_photo.jpg', { type: 'image/jpeg' });
      setFormData(prev => ({ ...prev, patient_photo: file }));
    }, 'image/jpeg', 0.9);
    stopStream();
    setCameraActive(false);
  }, [stopStream]);

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    setFormData(prev => ({ ...prev, patient_photo: null }));
    openCamera();
  }, [openCamera]);


  // Stop camera when modal closes or tab changes away
  useEffect(() => {
    if (!isOpen) stopStream();
  }, [isOpen, stopStream]);

  useEffect(() => {
    if (activeTab !== 'Identity') stopStream();
  }, [activeTab, stopStream]);
  // ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (formData.isOthersActive && othersInputRef.current) {
      othersInputRef.current.focus();
    }
  }, [formData.isOthersActive]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const [error, setError] = useState(null);

  const handleSave = async () => {
    try {
      setError(null);
      const initialKeys = [
        'patient_id', 'relation_type', 'relation_name', 'date_of_birth', 'age', 'gender',
        'blood_group', 'phone', 'email', 'address', 'permanent_address', 'education', 'occupation_past',
        'occupation_present', 'income_source', 'dialysis_supported_by', 'supporting_person_income',
        'marital_status', 'family_constellation', 'primary_diagnosis', 'diabetes', 'hypertension',
        'ckd_stage_v', 'others_diagnosis', 'av_fistula_created_on', 'dialysis_commenced_on',
        'past_medical_history', 'hiv_status', 'hepatitis_b', 'hepatitis_c', 'usg_abdomen', 'echo',
        'urea', 'creatinine', 'haemoglobin', 'electrolytes', 'sgot', 'sgpt', 'blood_pressure', 'current_weight',
        'dry_weight', 'pulse', 'temperature', 'vascular_access', 'dialysis_frequency', 'allergies',
        'clinical_alerts', 'contact_person_1_name', 'contact_person_1_phone', 'contact_person_2_name',
        'contact_person_2_phone', 'registration_date',
        'registration_done_by', 'unit_name', 'has_aadhar', 'aadhar_number', 'has_ration', 'ration_number',
        'has_cmchis', 'cmchis_number', 'status', 'status_remarks', 'notes'
      ];

      const cleanedData = new FormData();
      
      // Join first and last name for backend
      cleanedData.append('full_name', `${formData.first_name} ${formData.last_name}`.trim());
      
      // Mandatory validation
      if (!formData.has_aadhar || !formData.aadhar_number || (!patient && !formData.aadhar_proof)) {
        throw new Error("Aadhar Card details and proof are mandatory.");
      }
      if (!formData.has_ration || !formData.ration_number || (!patient && !formData.ration_proof)) {
        throw new Error("Ration Card details and proof are mandatory.");
      }
      if (!formData.has_cmchis || !formData.cmchis_number || (!patient && !formData.cmchis_proof)) {
        throw new Error("CMCHIS Card details and proof are mandatory.");
      }

      // Populate FormData
      initialKeys.forEach(key => {
        const val = formData[key];
        
        // Handle Numeric Fields
        if (['age', 'dry_weight', 'current_weight', 'pulse', 'temperature'].includes(key)) {
          if (val !== '' && val !== null && val !== undefined) {
            const num = Number(val);
            if (!isNaN(num)) cleanedData.append(key, num);
          }
          return;
        }

        // Handle Date Fields
        if (['date_of_birth', 'av_fistula_created_on', 'dialysis_commenced_on', 'registration_date'].includes(key)) {
          if (val) cleanedData.append(key, val);
          return;
        }

        // Handle Boolean Fields
        if (['hiv_status', 'hepatitis_b', 'hepatitis_c', 'diabetes', 'hypertension', 'ckd_stage_v', 'has_aadhar', 'has_ration', 'has_cmchis'].includes(key)) {
          cleanedData.append(key, val === true || val === 'true');
          return;
        }

        // Standard string fields
        if (val !== '' && val !== null && val !== undefined) {
          cleanedData.append(key, val);
        }
      });

      // Proof files - ONLY if it's a File object (newly uploaded)
      ['aadhar_proof', 'ration_proof', 'cmchis_proof', 'patient_photo'].forEach(key => {
        if (formData[key] instanceof File) {
          cleanedData.append(key, formData[key]);
        }
      });

      if (patient && patient.id) {
        await patientService.update(patient.id, cleanedData);
      } else {
        await patientService.create(cleanedData);
      }
      onRefresh();
      onClose();
    } catch (err) {
      console.error('API Error Response:', err.response?.data);
      const errorMsg = err.response?.data 
        ? Object.entries(err.response.data).map(([k, v]) => `${k}: ${v}`).join(', ')
        : err.message;
      setError(errorMsg);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tabs = ['Identity', 'Socio-Economic', 'Medical', 'Registration'];

  return (
    <div className="modal-overlay">
      <div className="modal-content patient-modal-content">
        <div className="modal-header">
          <h2>{patient ? 'Edit Patient Profile' : 'Register New Patient'}</h2>
          <button className="close-btn" onClick={onClose}><X /></button>
        </div>

        {error && (
          <div className="error-alert-banner animate-fade-in">
            <AlertCircle size={20} />
            <div className="error-text-box">
              <strong>Action Required</strong>
              <p>{error}</p>
            </div>
            <button className="error-close-btn" onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

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

              {/* ── CAMERA CAPTURE SECTION ── */}
              <div className="form-group full-width">
                <label><Camera size={16} /> Patient Photo</label>
                <div className="camera-capture-area">
                  {/* Hidden canvas for frame capture */}
                  <canvas ref={canvasRef} style={{ display: 'none' }} />

                  {capturedPhoto ? (
                    /* ── Photo Preview ── */
                    <div className="photo-preview-container">
                      <img src={getFullImageUrl(capturedPhoto)} alt="Captured patient" className="captured-photo" />
                      <div className="photo-actions">
                        <button type="button" className="retake-btn" onClick={retakePhoto}>
                          <RotateCcw size={16} /> Retake Photo
                        </button>
                      </div>
                    </div>
                  ) : cameraActive ? (
                    /* ── Live Camera Feed ── */
                    <div className="camera-feed-container">
                      <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
                      <button type="button" className="capture-btn" onClick={capturePhoto}>
                        <Camera size={20} /> Capture Photo
                      </button>
                    </div>
                  ) : (
                    /* ── Initial State ── */
                    <div className="camera-placeholder">
                      <div className="cam-icon-wrap"><Camera size={32} color="#94a3b8" /></div>
                      <p>No photo taken yet</p>
                      <div className="camera-btn-row">
                        <button type="button" className="open-camera-btn" onClick={openCamera}>
                          <Camera size={16} /> Open Camera
                        </button>
                        <span className="cam-or">or</span>
                        <label htmlFor="photo-upload" className="upload-photo-btn">
                          <Upload size={16} /> Upload Photo
                          <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={e => {
                              const file = e.target.files[0];
                              if (!file) return;
                              const url = URL.createObjectURL(file);
                              setCapturedPhoto(url);
                              setFormData(prev => ({ ...prev, patient_photo: file }));
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* ── END CAMERA SECTION ── */}

              <div className="form-group">
                <label><User size={16} /> First Name</label>
                <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label><User size={16} /> Last Name</label>
                <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} />
              </div>
              <div className="form-group full-width">
                <label><Users size={16} /> S/O, D/O, H/O, W/O</label>
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
                <label><Calendar size={16} /> Date of Birth</label>
                <input type="date" name="date_of_birth" value={formData.date_of_birth || ''} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label><Droplet size={16} /> Blood Group</label>
                <select name="blood_group" value={formData.blood_group} onChange={handleInputChange}>
                  <option value="">Select Blood Group</option>
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
                <label><Hash size={16} /> Age</label>
                <input type="number" name="age" value={formData.age} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label><User size={16} /> Sex</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange}>
                  <option value="">Select Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label><MapPin size={16} /> Present Address</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows="2"></textarea>
              </div>
              <div className="form-group full-width">
                <label><MapPin size={16} /> Permanent Address</label>
                <textarea name="permanent_address" value={formData.permanent_address} onChange={handleInputChange} rows="2"></textarea>
              </div>

              <div className="form-group">
                <label><Phone size={16} /> Phone Number</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label><Mail size={16} /> Email ID</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
              </div>
            </div>
          )}

          {activeTab === 'Socio-Economic' && (
            <div className="form-grid">
              <div className="form-group full-width">
                <label><GraduationCap size={16} /> Education Qualification</label>
                <input type="text" name="education" value={formData.education} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label><Briefcase size={16} /> Occupation Past</label>
                <input type="text" name="occupation_past" value={formData.occupation_past} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label><Briefcase size={16} /> Occupation Present</label>
                <input type="text" name="occupation_present" value={formData.occupation_present} onChange={handleInputChange} />
              </div>
              <div className="form-group full-width">
                <label><DollarSign size={16} /> Salary or Pension or Unemployed</label>
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
              
              <div className="form-group full-width">
                <label>Comorbidities</label>
                <select 
                  name="diagnosis_type" 
                  value={
                    formData.diabetes ? "Diabetes" : 
                    formData.hypertension ? "Hypertension" : 
                    formData.ckd_stage_v ? "CKD Stage V" : 
                    (formData.others_diagnosis || (formData.diabetes === false && formData.hypertension === false && formData.ckd_stage_v === false && formData.isOthersActive)) ? "Others" : ""
                  } 
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      diabetes: val === "Diabetes",
                      hypertension: val === "Hypertension",
                      ckd_stage_v: val === "CKD Stage V",
                      others_diagnosis: val === "Others" ? prev.others_diagnosis : "",
                      isOthersActive: val === "Others"
                    }));
                  }}
                >
                  <option value="">Select Comorbidity</option>
                  <option value="None">None</option>
                  <option value="Diabetes">Diabetes</option>
                  <option value="Hypertension">Hypertension</option>
                  <option value="CKD Stage V">CKD Stage V</option>
                  <option value="Others">Others</option>
                </select>
              </div>

              {(formData.diabetes === false && formData.hypertension === false && formData.ckd_stage_v === false && (formData.others_diagnosis || formData.isOthersActive)) && (
                <div className="form-group full-width animate-slide-down">
                  <label>Specify Other Condition</label>
                  <input 
                    ref={othersInputRef}
                    type="text" 
                    name="others_diagnosis" 
                    value={formData.others_diagnosis} 
                    onChange={handleInputChange} 
                    placeholder="Enter the exact condition..."
                  />
                </div>
              )}

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
                <label>SGOT</label>
                <input type="text" name="sgot" value={formData.sgot} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>SGPT</label>
                <input type="text" name="sgpt" value={formData.sgpt} onChange={handleInputChange} />
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
                  <option value="">Select Frequency</option>
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

              <div className="section-title full-width">Patient's Commitments (Mandatory)</div>
              
              <div className="commitment-row full-width">
                <div className="form-group">
                  <label>Aadhar Card Number <span className="req">*</span></label>
                  <input type="text" name="aadhar_number" value={formData.aadhar_number} onChange={handleInputChange} placeholder="Enter Aadhar Number" />
                </div>
                <div className="form-group">
                  <label>Aadhar Proof (Scan/Upload) <span className="req">*</span></label>
                  <div className="file-upload-wrapper">
                    <input 
                      type="file" 
                      id="aadhar_proof" 
                      onChange={(e) => setFormData(prev => ({...prev, aadhar_proof: e.target.files[0], has_aadhar: true}))} 
                    />
                    <label htmlFor="aadhar_proof" className="file-label premium-upload">
                      <div className="upload-content">
                        <Scan size={20} className="upload-icon" />
                        <span>{formData.aadhar_proof ? formData.aadhar_proof.name : 'Scan or Upload Aadhar'}</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="commitment-row full-width">
                <div className="form-group">
                  <label>Ration Card Number <span className="req">*</span></label>
                  <input type="text" name="ration_number" value={formData.ration_number} onChange={handleInputChange} placeholder="Enter Ration Number" />
                </div>
                <div className="form-group">
                  <label>Ration Proof (Scan/Upload) <span className="req">*</span></label>
                  <div className="file-upload-wrapper">
                    <input 
                      type="file" 
                      id="ration_proof" 
                      onChange={(e) => setFormData(prev => ({...prev, ration_proof: e.target.files[0], has_ration: true}))} 
                    />
                    <label htmlFor="ration_proof" className="file-label premium-upload">
                      <div className="upload-content">
                        <Scan size={20} className="upload-icon" />
                        <span>{formData.ration_proof ? formData.ration_proof.name : 'Scan or Upload Ration Card'}</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="commitment-row full-width">
                <div className="form-group">
                  <label>CMCHIS Card Number <span className="req">*</span></label>
                  <input type="text" name="cmchis_number" value={formData.cmchis_number} onChange={handleInputChange} placeholder="Enter CMCHIS Number" />
                </div>
                <div className="form-group">
                  <label>CMCHIS Proof (Scan/Upload) <span className="req">*</span></label>
                  <div className="file-upload-wrapper">
                    <input 
                      type="file" 
                      id="cmchis_proof" 
                      onChange={(e) => setFormData(prev => ({...prev, cmchis_proof: e.target.files[0], has_cmchis: true}))} 
                    />
                    <label htmlFor="cmchis_proof" className="file-label premium-upload">
                      <div className="upload-content">
                        <Scan size={20} className="upload-icon" />
                        <span>{formData.cmchis_proof ? formData.cmchis_proof.name : 'Scan or Upload CMCHIS'}</span>
                      </div>
                    </label>
                  </div>
                </div>
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
                <label>Unit</label>
                <input type="text" name="unit_name" value={formData.unit_name} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Patient ID (System)</label>
                <input type="text" name="patient_id" value={formData.patient_id} onChange={handleInputChange} />
              </div>
              <div className="status-row full-width">
                <div className="form-group">
                  <label>System Status</label>
                  <select name="status" value={formData.status} onChange={handleInputChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Transferred">Transferred</option>
                    <option value="Deceased">Deceased</option>
                  </select>
                </div>
                {formData.status !== 'Active' && (
                  <div className="form-group animate-slide-down">
                    <label>Status Remarks <span className="req">*</span></label>
                    <input 
                      type="text" 
                      name="status_remarks" 
                      value={formData.status_remarks} 
                      onChange={handleInputChange} 
                      placeholder="Reason for status change..."
                      required
                    />
                  </div>
                )}
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


          {/* ── ACTION BUTTONS (Scrollable) ── */}
          <div className="form-actions-row">
            <button type="button" className="cancel-btn" onClick={onClose}>
              <X size={18} />
              <span>Cancel</span>
            </button>
            
            {(formData.first_name.trim() && 
              formData.last_name.trim() && 
              formData.aadhar_number.trim() && 
              (patient || formData.aadhar_proof) &&
              formData.ration_number.trim() && 
              (patient || formData.ration_proof) &&
              formData.cmchis_number.trim() && 
              (patient || formData.cmchis_proof)) ? (
              <button type="button" className="save-btn" onClick={handleSave}>
                <Save size={18} />
                <span>Save Registration Form</span>
              </button>
            ) : activeTab !== 'Registration' ? (
              <button 
                type="button"
                className="save-btn" 
                onClick={() => {
                  const currentIndex = tabs.indexOf(activeTab);
                  if (currentIndex < tabs.length - 1) {
                    setActiveTab(tabs[currentIndex + 1]);
                  }
                }}
              >
                <span>Next</span>
                <ChevronRight size={18} />
              </button>
            ) : (
              <div className="form-incomplete-msg">
                <AlertCircle size={16} />
                <span>Complete all mandatory fields to save</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PatientModal;
