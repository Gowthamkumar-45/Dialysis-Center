import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  User, Mail, Calendar, Heart, Weight, Activity,
  Thermometer, AlertCircle, CheckCircle, MoreHorizontal,
  Edit, History as HistoryIcon, MessageSquare, Shield,
  FileText, FileText as ReportIcon, Eye, Edit2, Phone
} from 'lucide-react';
import { patientService, appointmentService, treatmentSessionService, getFullImageUrl } from '../../services/api';
import PatientModal from './PatientModal';
import SessionReportModal from '../Scheduling/SessionReportModal';
import SessionDetailModal from './SessionDetailModal';
import './PatientProfile.css';

const PatientProfile = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Summary');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isSessionDetailOpen, setIsSessionDetailOpen] = useState(false);
  const [isSessionEditMode, setIsSessionEditMode] = useState(false);
  const [latestAppointment, setLatestAppointment] = useState(null);

  const fetchPatientData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await patientService.getById(id);
      const data = response.data;

      let historyData = [];

      try {
        const [apptsRes, sessionsRes] = await Promise.all([
          appointmentService.getAll(),
          treatmentSessionService.getAll()
        ]);

        const patientAppts = apptsRes.data
          .filter(a => String(a.patient) === String(id))
          .sort((a, b) => new Date(b.date) - new Date(a.date));

        const pendingAppt = patientAppts.find(a => a.status === 'Upcoming' || a.status === 'Scheduled' || a.status === 'In Progress');

        if (pendingAppt) {
          setLatestAppointment(pendingAppt);
        } else {
          setLatestAppointment(null);
        }

        const patientSessions = sessionsRes.data
          .filter(s => String(s.patient) === String(id))
          .sort((a, b) => {
            const dateDiff = new Date(b.date) - new Date(a.date);
            if (dateDiff !== 0) return dateDiff;
            return b.id - a.id;
          })
          .slice(0, 5);

        historyData = patientSessions.map(s => ({
          ...s,
          date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          statusColor: s.status_color
        }));
      } catch (err) {
        console.error("Error fetching related data for profile:", err);
      }

      const combinedData = {
        ...data,
        age: data.age || 'N/A',
        gender: data.gender === 'M' ? 'Male' : data.gender === 'F' ? 'Female' : data.gender === 'O' ? 'Other' : 'Not Set',
        blood_group: data.blood_group || 'Not Set',
        primary_clinician: data.primary_clinician || 'Clinician Not Assigned',
        emergency_contact: data.contact_person_1_name || 'None Listed',
        emergency_phone: data.contact_person_1_phone || '',
        diagnosis: data.primary_diagnosis || 'CKD Patient',
        diagnosis_secondary: data.notes || '',
        dialysis_start: data.dialysis_commenced_on ?
          new Date(data.dialysis_commenced_on).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          }) : 'N/A',
        frequency: data.dialysis_frequency || 'Scheduled as per plan',
        vascular_access: data.vascular_access || 'Not Set',
        vitals: {
          bp: data.blood_pressure || '---/--',
          weight: data.current_weight || data.dry_weight || '0.0',
          pulse: data.pulse || '0',
          temp: data.temperature || '0.0'
        },
        alerts: [
          ...(data.allergies ? [{ type: 'red', title: 'Allergy Detected', text: data.allergies }] : []),
          ...(data.clinical_alerts ? [{ type: 'yellow', title: 'Clinical Restriction', text: data.clinical_alerts }] : []),
          ...(data.hiv_status ? [{ type: 'orange', title: 'HIV Positive', text: 'Patient is HIV Positive. Follow specialized protocols.' }] : []),
          ...(data.hepatitis_b ? [{ type: 'orange', title: 'HBsAg Positive', text: 'Patient is Hepatitis B Positive.' }] : []),
          ...(data.hepatitis_c ? [{ type: 'orange', title: 'HCV Positive', text: 'Patient is Hepatitis C Positive.' }] : [])
        ],
        history: historyData
      };
      setPatient(combinedData);
    } catch (error) {
      console.error("Error fetching patient profile:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleViewRecord = (session) => {
    setSelectedSession(session);
    setIsSessionEditMode(false);
    setIsSessionDetailOpen(true);
  };

  const handleEditRecord = (session) => {
    setSelectedSession(session);
    setIsSessionEditMode(true);
    setIsSessionDetailOpen(true);
  };

  const handleMessagePatient = () => {
    if (patient.phone) {
      window.open(`https://wa.me/${patient.phone.replace(/\D/g, '')}`, '_blank');
    } else if (patient.email) {
      window.location.href = `mailto:${patient.email}`;
    } else {
      alert("No contact information available for this patient.");
    }
  };

  const handleCallPatient = () => {
    if (patient.phone) {
      window.location.href = `tel:${patient.phone}`;
    } else if (patient.emergency_phone) {
      window.location.href = `tel:${patient.emergency_phone}`;
    } else {
      alert("No phone number available for this patient.");
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [fetchPatientData]);

  if (loading || !patient) return <div className="p-10 text-center">Loading profile...</div>;

  return (
    <div className="patient-profile-page">
      <div className="profile-container-inner">
        {/* Left Patient Card */}
        <aside className="patient-card-sidebar">
          <div className="sidebar-card">
            <div className="p-image-area">
              {patient.patient_photo ? (
                <img src={getFullImageUrl(patient.patient_photo)} alt={patient.full_name} />
              ) : (
                <div className="p-image-placeholder">
                  <User size={64} color="#94a3b8" />
                </div>
              )}
            </div>
            <h2 className="p-name">{patient.full_name}</h2>
            <div className="p-id-label">ID: {patient.patient_id}</div>

            <div className="p-mini-stats">
              <div className="mini-stat">
                <span className="label">RELATION</span>
                <span className="val">{patient.relation_type} {patient.relation_name}</span>
              </div>
              <div className="mini-stat">
                <span className="label">BLOOD TYPE</span>
                <span className="val red">{patient.blood_group}</span>
              </div>
            </div>

            <div className="p-detailed-info">
              <div className="info-row">
                <span className="row-label"><User size={14} /> AGE / SEX</span>
                <span className="row-val">{patient.age} / {patient.gender}</span>
              </div>
              <div className="info-row">
                <span className="row-label"><Mail size={14} /> Emergency Contact</span>
                <span className="row-val">{patient.emergency_contact}</span>
                <span className="row-sub">{patient.emergency_phone}</span>
              </div>
            </div>

            <div className="sidebar-actions">
              <button className="msg-patient-btn" onClick={handleMessagePatient}>
                <MessageSquare size={16} />
                Message Patient
              </button>
              <button className="call-patient-btn" onClick={handleCallPatient}>
                <Phone size={16} />
                Call Patient
              </button>
            </div>
          </div>
        </aside>

        {/* Right Main Content */}
        <div className="profile-main-area">
          <header className="profile-header-group">
            <div className="header-left">
              <div className="status-tags">
                {patient.hiv_status && (
                  <span className="tag-pill orange">HIV Positive</span>
                )}
                <div className="profile-badge-group">
                  <span className={`status-badge ${patient.status?.toLowerCase()}`}>
                    {patient.status || 'Active'}
                  </span>
                  {patient.status !== 'Active' && patient.status_remarks && (
                    <span className="status-remarks-badge">
                      Note: {patient.status_remarks}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="header-actions-row">
              <button className="btn-action-text" onClick={() => setIsEditModalOpen(true)}>
                <Edit size={16} /> Edit Details
              </button>
              <button
                className="btn-action-text"
                onClick={() => setIsReportModalOpen(true)}
                disabled={!latestAppointment}
                title={!latestAppointment ? "Cannot add report: No active or upcoming session booked for this patient" : "Add post-dialysis report for current session"}
              >
                <ReportIcon size={16} /> Add Post-Report
              </button>
              <button className="btn-action-blue"><Calendar size={16} /> Schedule Session</button>
            </div>
          </header>

          <nav className="profile-tabs-nav">
            {['Summary', 'History', 'Socio-Economic', 'Medical', 'Registration'].map(tab => (
              <button
                key={tab}
                className={`tab-item ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </nav>

          <section className="vitals-strip">
            <div className="v-card">
              <div className="v-icon-box red"><Heart size={18} /></div>
              <div className="v-data">
                <span className="v-label">LATEST BP</span>
                <div className="v-val-group">
                  <span className="v-val">{patient.vitals.bp}</span>
                  <span className="v-unit">mmHg</span>
                </div>
              </div>
            </div>
            <div className="v-card">
              <div className="v-icon-box orange"><Weight size={18} /></div>
              <div className="v-data">
                <span className="v-label">LAST WEIGHT</span>
                <div className="v-val-group">
                  <span className="v-val">{patient.vitals.weight}</span>
                  <span className="v-unit">kg</span>
                </div>
              </div>
            </div>
            <div className="v-card">
              <div className="v-icon-box blue"><Activity size={18} /></div>
              <div className="v-data">
                <span className="v-label">AVG PULSE</span>
                <div className="v-val-group">
                  <span className="v-val">{patient.vitals.pulse}</span>
                  <span className="v-unit">bpm</span>
                </div>
              </div>
            </div>
            <div className="v-card">
              <div className="v-icon-box teal"><Thermometer size={18} /></div>
              <div className="v-data">
                <span className="v-label">TEMPERATURE</span>
                <div className="v-val-group">
                  <span className="v-val">{patient.vitals.temp}</span>
                  <span className="v-unit">°C</span>
                </div>
              </div>
            </div>

            {/* Second Row of Insights */}
            <div className="v-card">
              <div className="v-icon-box orange"><Weight size={18} /></div>
              <div className="v-data">
                <span className="v-label">DRY WEIGHT</span>
                <div className="v-val-group">
                  <span className="v-val">{patient.dry_weight || '0.0'}</span>
                  <span className="v-unit">kg</span>
                </div>
              </div>
            </div>
            <div className="v-card">
              <div className="v-icon-box red"><Shield size={18} /></div>
              <div className="v-data">
                <span className="v-label">BLOOD TYPE</span>
                <div className="v-val-group">
                  <span className="v-val">{patient.blood_group}</span>
                </div>
              </div>
            </div>
            <div className="v-card">
              <div className="v-icon-box blue"><AlertCircle size={18} /></div>
              <div className="v-data">
                <span className="v-label">HEPATITIS</span>
                <div className="v-val-group">
                  <span className="v-val" style={{ fontSize: '0.75rem' }}>
                    {patient.hepatitis_b ? 'B+' : ''} {patient.hepatitis_c ? 'C+' : ''} {(!patient.hepatitis_b && !patient.hepatitis_c) ? 'Negative' : ''}
                  </span>
                </div>
              </div>
            </div>
            <div className="v-card">
              <div className="v-icon-box teal"><HistoryIcon size={18} /></div>
              <div className="v-data">
                <span className="v-label">FREQUENCY</span>
                <div className="v-val-group">
                  <span className="v-val" style={{ fontSize: '0.8rem' }}>{patient.frequency}</span>
                </div>
              </div>
            </div>
          </section>

          {activeTab === 'Summary' && (            <div className="clinical-grid">
              <div className="diagnosis-card">
                <div className="card-header-inner">
                  <Shield size={18} className="icon-blue" />
                  <h3>Current Status</h3>
                </div>
                <div className="diagnosis-box">
                  <span className="diag-main">{patient.diagnosis}</span>
                  <span className="diag-sub">{patient.diagnosis_secondary}</span>
                </div>
                <div className="diag-info-grid">
                  <div className="diag-item">
                    <span className="l">Primary Clinician:</span>
                    <span className="v">{patient.primary_clinician || 'Not Assigned'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">Vascular Access:</span>
                    <span className="v">{patient.vascular_access || 'Not Set'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">Dialysis Commenced:</span>
                    <span className="v">{patient.dialysis_start}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">Frequency:</span>
                    <span className="v">{patient.frequency}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">AV Fistula Created:</span>
                    <span className="v">{patient.av_fistula_created_on || 'N/A'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">CKD Stage V:</span>
                    <span className="v">{patient.ckd_stage_v ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              <div className="alerts-card">
                <div className="card-header-inner">
                  <AlertCircle size={18} className="icon-red" />
                  <h3>Clinical Alerts</h3>
                </div>
                <div className="alerts-stack">
                  {patient.alerts.length > 0 ? (
                    patient.alerts.map((alert, idx) => (
                      <div key={idx} className={`alert-box ${alert.type}`}>
                        <CheckCircle size={16} />
                        <div className="alert-text">
                          <span className="a-title">{alert.title}</span>
                          <p>{alert.text}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-alerts-placeholder">
                      <CheckCircle size={16} className="icon-green" />
                      <span>No critical alerts recorded.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* New Identity Card */}
              <div className="diagnosis-card">
                <div className="card-header-inner">
                  <FileText size={18} className="icon-blue" />
                  <h3>Identity & Documents</h3>
                </div>
                <div className="diag-info-grid">
                  <div className="diag-item">
                    <span className="l">Aadhar Number:</span>
                    <span className="v">{patient.aadhar_number || 'Not Linked'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">Ration Number:</span>
                    <span className="v">{patient.ration_number || 'Not Linked'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">CMCHIS Number:</span>
                    <span className="v">{patient.cmchis_number || 'Not Linked'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">Registration Date:</span>
                    <span className="v">{patient.registration_date || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* New Emergency Contact Card */}
              <div className="diagnosis-card">
                <div className="card-header-inner">
                  <User size={18} className="icon-blue" />
                  <h3>Emergency Contacts</h3>
                </div>
                <div className="diag-info-grid">
                  <div className="diag-item">
                    <span className="l">Primary Contact:</span>
                    <span className="v">{patient.contact_person_1_name || 'None'}</span>
                    <span className="v-text">{patient.contact_person_1_phone}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">Secondary Contact:</span>
                    <span className="v">{patient.contact_person_2_name || 'None'}</span>
                    <span className="v-text">{patient.contact_person_2_phone}</span>
                  </div>
                  <div className="diag-item full-width">
                    <span className="l">Residential Address:</span>
                    <span className="v">{patient.address}</span>
                  </div>
                </div>
              </div>

              {/* New Socio-Economic Card */}
              <div className="diagnosis-card">
                <div className="card-header-inner">
                  <User size={18} className="icon-blue" />
                  <h3>Background & Socio-Economic</h3>
                </div>
                <div className="diag-info-grid">
                  <div className="diag-item">
                    <span className="l">Education:</span>
                    <span className="v">{patient.education || 'N/A'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">Marital Status:</span>
                    <span className="v">{patient.marital_status || 'N/A'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">Past Occupation:</span>
                    <span className="v">{patient.occupation_past || 'N/A'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">Present Occupation:</span>
                    <span className="v">{patient.occupation_present || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Socio-Economic' && (
            <div className="clinical-grid">
              <div className="diagnosis-card full-width-card">
                <div className="card-header-inner">
                  <User size={18} className="icon-blue" />
                  <h3>Background & Income</h3>
                </div>
                <div className="diag-info-grid three-col">
                  <div className="diag-item">
                    <span className="l">Education:</span>
                    <span className="v">{patient.education || 'N/A'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">Marital Status:</span>
                    <span className="v">{patient.marital_status || 'N/A'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">Occupation (Past):</span>
                    <span className="v">{patient.occupation_past || 'N/A'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">Occupation (Present):</span>
                    <span className="v">{patient.occupation_present || 'N/A'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">Income Source:</span>
                    <span className="v">{patient.income_source || 'N/A'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">Dialysis Supported By:</span>
                    <span className="v">{patient.dialysis_supported_by || 'N/A'}</span>
                  </div>
                  <div className="diag-item full-width">
                    <span className="l">Family Constellation:</span>
                    <p className="v-text">{patient.family_constellation || 'No details provided.'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Medical' && (
            <div className="clinical-grid">
              <div className="diagnosis-card full-width-card">
                <div className="card-header-inner">
                  <Activity size={18} className="icon-blue" />
                  <h3>Scheme Patient Investigations</h3>
                </div>
                <div className="diag-info-grid three-col">
                  <div className="diag-item">
                    <span className="l">USG Abdomen:</span>
                    <span className="v">{patient.usg_abdomen || 'N/A'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">Echo:</span>
                    <span className="v">{patient.echo || 'N/A'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">SGOT:</span>
                    <span className="v">{patient.sgot || 'N/A'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">SGPT:</span>
                    <span className="v">{patient.sgpt || 'N/A'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">Urea:</span>
                    <span className="v">{patient.urea || 'N/A'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">Creatinine:</span>
                    <span className="v">{patient.creatinine || 'N/A'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">Haemoglobin:</span>
                    <span className="v">{patient.haemoglobin || 'N/A'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">Electrolytes:</span>
                    <span className="v">{patient.electrolytes || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Registration' && (
            <div className="clinical-grid">
              <div className="diagnosis-card">
                <div className="card-header-inner">
                  <Shield size={18} className="icon-blue" />
                  <h3>System & Registration</h3>
                </div>
                <div className="diag-info-grid">
                  <div className="diag-item">
                    <span className="l">Reg Date:</span>
                    <span className="v">{patient.registration_date || 'N/A'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">Unit:</span>
                    <span className="v">{patient.unit_name || 'N/A'}</span>
                  </div>
                  <div className="diag-item">
                    <span className="l">Done By:</span>
                    <span className="v">{patient.registration_done_by || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="diagnosis-card">
                <div className="card-header-inner">
                  <User size={18} className="icon-blue" />
                  <h3>Emergency Contacts</h3>
                </div>
                <div className="diag-info-grid">
                  {[1, 2].map(num => (
                    <div key={num} className="diag-item">
                      <span className="l">Contact {num}:</span>
                      <span className="v">{patient[`contact_person_${num}_name`] || 'N/A'}</span>
                      <span className="v-text">{patient[`contact_person_${num}_phone`] || 'No phone'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="diagnosis-card">
                <div className="card-header-inner">
                  <FileText size={18} className="icon-blue" />
                  <h3>Identity & Documents</h3>
                </div>
                <div className="diag-info-grid">
                  <div className="diag-item">
                    <span className="l">Aadhar Number:</span>
                    <span className="v">{patient.aadhar_number || 'N/A'}</span>
                    {patient.aadhar_proof && <a href={patient.aadhar_proof} target="_blank" rel="noreferrer" className="proof-link">View Proof</a>}
                  </div>
                  <div className="diag-item">
                    <span className="l">Ration Number:</span>
                    <span className="v">{patient.ration_number || 'N/A'}</span>
                    {patient.ration_proof && <a href={patient.ration_proof} target="_blank" rel="noreferrer" className="proof-link">View Proof</a>}
                  </div>
                  <div className="diag-item">
                    <span className="l">CMCHIS Number:</span>
                    <span className="v">{patient.cmchis_number || 'N/A'}</span>
                    {patient.cmchis_proof && <a href={patient.cmchis_proof} target="_blank" rel="noreferrer" className="proof-link">View Proof</a>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'History' && (
            <section className="recent-sessions-card">
              <div className="sessions-header">
                <div className="h-left">
                  <h3>Recent Treatment Sessions</h3>
                  <p>Comprehensive log of the last five dialysis procedures.</p>
                </div>
                <button className="btn-more"><MoreHorizontal size={20} /></button>
              </div>

              {patient.history.length > 0 ? (
                <table className="sessions-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Machine</th>
                      <th>Staff In-Charge</th>
                      <th>Duration</th>
                      <th>Outcome</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.history.map((session, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="cell-date-time">
                            <span className="c-date">{session.date}</span>
                            <span className="c-time">{session.time}</span>
                          </div>
                        </td>
                        <td><span className="m-tag">{session.machine}</span></td>
                        <td><span className="c-staff">{session.staff}</span></td>
                        <td><span className="c-duration">{session.duration}</span></td>
                        <td>
                          <div className="cell-outcome">
                            <span className={`dot ${session.statusColor}`}></span>
                            {session.outcome}
                          </div>
                        </td>
                        <td>
                          <div className="action-icons">
                            <button className="icon-btn view" onClick={() => handleViewRecord(session)} title="View Details">
                              <Eye size={18} />
                            </button>
                            <button className="icon-btn edit" onClick={() => handleEditRecord(session)} title="Edit Record">
                              <Edit2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-sessions-placeholder">
                  <HistoryIcon size={40} />
                  <p>No treatment sessions recorded for this patient yet.</p>
                  <span>Complete a session to see the history here.</span>
                </div>
              )}
            </section>
          )}
        </div>
      </div>

      <PatientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onRefresh={fetchPatientData}
        patient={patient}
      />
      {/* Session Report Modal */}
      {latestAppointment && (
        <SessionReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          appointment={latestAppointment}
          onRefresh={fetchPatientData}
        />
      )}
      <SessionDetailModal
        isOpen={isSessionDetailOpen}
        onClose={() => setIsSessionDetailOpen(false)}
        session={selectedSession}
        onRefresh={fetchPatientData}
        isEditMode={isSessionEditMode}
      />
    </div>
  );
};

export default PatientProfile;
