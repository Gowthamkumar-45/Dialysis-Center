import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  User, Mail, Calendar, Heart, Weight, Activity, 
  Thermometer, AlertCircle, CheckCircle, MoreHorizontal,
  Edit, History as HistoryIcon, MessageSquare, Shield,
  FileText as ReportIcon
} from 'lucide-react';
import { patientService, appointmentService, treatmentSessionService } from '../../services/api';
import PatientModal from './PatientModal';
import SessionReportModal from '../Scheduling/SessionReportModal';
import './PatientProfile.css';

const PatientProfile = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Summary');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
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
        
        // Find the most recent appointment that NEEDS a report (not completed/cancelled)
        const pendingAppt = patientAppts.find(a => a.status === 'Scheduled' || a.status === 'In Progress');
        
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
            return b.id - a.id; // Most recent ID first
          })
          .slice(0, 5);
        
        historyData = patientSessions.map(s => ({
          date: new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          time: s.time,
          machine: s.machine,
          staff: s.staff,
          duration: s.duration,
          outcome: s.outcome,
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
        emergency_contact: data.emergency_contact || 'None Listed',
        emergency_phone: data.emergency_phone || '',
        diagnosis: data.primary_diagnosis || 'CKD Patient',
        diagnosis_secondary: data.notes || '',
        dialysis_start: data.created_at ? 
          new Date(data.created_at).toLocaleDateString('en-GB', {
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
          ...(data.clinical_alerts ? [{ type: 'yellow', title: 'Clinical Restriction', text: data.clinical_alerts }] : [])
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

  useEffect(() => {
    fetchPatientData();
  }, [fetchPatientData]);

  if (loading || !patient) return <div className="p-10 text-center">Loading profile...</div>;

  return (
    <div className="patient-profile-page">
      <div className="profile-container-inner">
        {/* Left Patient Card */}
        <aside className="patient-card-sidebar">
          <h1 className="profile-title sidebar-title">Patient Profile</h1>
          <div className="sidebar-card">
            <div className="p-image-area">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200" alt="Robert J. Henderson" />
            </div>
            <h2 className="p-name">{patient.full_name}</h2>
            <div className="p-id-label">ID: {patient.patient_id}</div>
            
            <div className="p-mini-stats">
              <div className="mini-stat">
                <span className="label">AGE/SEX</span>
                <span className="val">{patient.age} / {patient.gender}</span>
              </div>
              <div className="mini-stat">
                <span className="label">BLOOD TYPE</span>
                <span className="val red">{patient.blood_group}</span>
              </div>
            </div>

            <div className="p-detailed-info">
              <div className="info-row">
                <span className="row-label"><User size={14} /> Primary Clinician</span>
                <span className="row-val">{patient.primary_clinician}</span>
              </div>
              <div className="info-row">
                <span className="row-label"><Mail size={14} /> Emergency Contact</span>
                <span className="row-val">{patient.emergency_contact}</span>
                <span className="row-sub">{patient.emergency_phone}</span>
              </div>
            </div>

            <button className="msg-patient-btn">
              <MessageSquare size={16} />
              Message Patient
            </button>
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
                <span className="tag-pill green">{patient.status} Case</span>
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
                title={!latestAppointment ? "No appointments found" : "Add post-dialysis report"}
              >
                <ReportIcon size={16} /> Add Post-Report
              </button>
              <button className="btn-action-blue"><Calendar size={16} /> Schedule Session</button>
            </div>
          </header>

          <nav className="profile-tabs-nav">
            {['Summary', 'History', 'Meds & Notes', 'Insurance', 'Documents', 'Privacy'].map(tab => (
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
          </section>

          <div className="clinical-grid">
            <div className="diagnosis-card">
              <div className="card-header-inner">
                <Shield size={18} className="icon-blue" />
                <h3>Current Diagnosis</h3>
              </div>
              <div className="diagnosis-box">
                <span className="diag-main">{patient.diagnosis}</span>
                <span className="diag-sub">{patient.diagnosis_secondary}</span>
              </div>
              <div className="diag-info-grid">
                <div className="diag-item">
                  <span className="l">Dialysis Start Date:</span>
                  <span className="v">{patient.dialysis_start}</span>
                </div>
                <div className="diag-item">
                  <span className="l">Frequency:</span>
                  <span className="v">{patient.frequency}</span>
                </div>
                <div className="diag-item">
                  <span className="l">Vascular Access:</span>
                  <span className="v">{patient.vascular_access}</span>
                </div>
              </div>
            </div>

            <div className="alerts-card">
              <div className="card-header-inner">
                <AlertCircle size={18} className="icon-red" />
                <h3>Critical Alerts</h3>
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
          </div>

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
                      <td><button className="btn-view-record">View Record</button></td>
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
    </div>
  );
};

export default PatientProfile;
