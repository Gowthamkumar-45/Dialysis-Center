import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Activity,
  FileText,
} from 'lucide-react';
import { staffService, appointmentService, attendanceService, getFullImageUrl } from '../../services/api';
import './StaffProfile.css';

const StaffProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');
  const [member, setMember] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [attendancePercentage, setAttendancePercentage] = useState('100%');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [memberRes, apptRes, attendanceRes] = await Promise.all([
          staffService.getById(id),
          appointmentService.getAll(),
          attendanceService.getAll({ staff: id })
        ]);

        setMember(memberRes.data);

        // Filter appointments assigned to this staff member
        const staffId = parseInt(id);
        const staffAppts = apptRes.data.filter(a =>
          Number(a.staff) === staffId ||
          (a.staff_name && a.staff_name === memberRes.data.name) ||
          (a.attending_staff && a.attending_staff === memberRes.data.name)
        ).sort((a, b) => new Date(a.date) - new Date(b.date));

        setAppointments(staffAppts);

        // Calculate attendance percentage dynamically
        const attendanceRecords = attendanceRes.data || [];
        if (attendanceRecords.length > 0) {
          const activeRecords = attendanceRecords.filter(r => r.status !== 'Leave');
          if (activeRecords.length > 0) {
            const attendedCount = activeRecords.reduce((acc, r) => {
              if (r.status === 'Present' || r.status === 'Late') return acc + 1;
              if (r.status === 'Half-Day') return acc + 0.5;
              return acc;
            }, 0);
            const pct = Math.round((attendedCount / activeRecords.length) * 100);
            setAttendancePercentage(`${pct}%`);
          } else {
            setAttendancePercentage('100%');
          }
        } else {
          setAttendancePercentage('100%');
        }
      } catch (err) {
        console.error('Error fetching staff data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const stats = [
    { 
      label: 'Sessions Completed', 
      value: appointments.filter(a => a.status === 'Completed').length, 
      icon: <Activity size={18} />, 
      color: 'amber' 
    },
    { label: 'Procedures', value: '—', icon: <Award size={18} />, color: 'sky' },
    { label: 'Attendance', value: attendancePercentage, icon: <Calendar size={18} />, color: 'emerald' },
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Loading profile...</div>;
  }

  if (!member) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Staff member not found.</p>
        <button onClick={() => navigate('/staff')}>Back to Staff</button>
      </div>
    );
  }

  const statusLabel = member.is_on_duty ? 'On Duty' : 'Off Duty';
  const statusClass = member.is_on_duty ? 'on-duty' : 'off-duty';
  const photoUrl = member.staff_photo || member.avatar_url || member.photo || member.image || member.profile_photo;
  const avatarUrl =
    getFullImageUrl(photoUrl) ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.name || 'staff')}`;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Overview':
        return (
          <div className="animate-fade-in">
            <section className="profile-section">
              <h3>About Professional</h3>
              <p className="about-text">
                {member.bio || `${member.role} on the dialysis care team. Reachable at ${member.email || 'no email on file'}.`}
              </p>
            </section>

            <section className="profile-section">
              <h3>Professional Details</h3>
              <div className="details-grid">
                <div className="detail-item">
                  <label>Role</label>
                  <p>{member.role}</p>
                </div>
                <div className="detail-item">
                  <label>Status</label>
                  <p>{statusLabel}</p>
                </div>
                <div className="detail-item">
                  <label>Age</label>
                  <p>{member.age || '—'}</p>
                </div>
                <div className="detail-item">
                  <label>Gender</label>
                  <p>{member.gender || '—'}</p>
                </div>
                <div className="detail-item">
                  <label>Email</label>
                  <p>{member.email || '—'}</p>
                </div>
                <div className="detail-item">
                  <label>Phone</label>
                  <p>{member.phone || '—'}</p>
                </div>
              </div>
            </section>

            <section className="profile-section">
              <h3>Academic History</h3>
              <div className="education-timeline">
                {/* PG Section - Only show if data exists */}
                {(member.edu_pg_college || member.edu_pg_degree) && (
                  <div className="edu-card">
                    <div className="edu-header">
                      <h4>Postgraduate</h4>
                      <span className="edu-year">{member.edu_pg_year || '—'}</span>
                    </div>
                    <p className="edu-degree">{member.edu_pg_degree || '—'}</p>
                    <p className="edu-college">{member.edu_pg_college || '—'}</p>
                    {member.edu_pg_mark && (
                      <p className="edu-score">Marks: {member.edu_pg_mark}/{member.edu_pg_total}</p>
                    )}
                  </div>
                )}

                {/* UG Section */}
                <div className="edu-card">
                  <div className="edu-header">
                    <h4>Undergraduate</h4>
                    <span className="edu-year">{member.edu_ug_year || '—'}</span>
                  </div>
                  <p className="edu-degree">{member.edu_ug_degree || '—'}</p>
                  <p className="edu-college">{member.edu_ug_college || '—'}</p>
                  {member.edu_ug_mark && (
                    <p className="edu-score">Marks: {member.edu_ug_mark}/{member.edu_ug_total}</p>
                  )}
                </div>

                {/* 12th Section */}
                <div className="edu-card secondary">
                  <div className="edu-header">
                    <h4>Higher Secondary (12th)</h4>
                    <span className="edu-year">{member.edu_12th_year || '—'}</span>
                  </div>
                  <p className="edu-school">{member.edu_12th_school || '—'}</p>
                  {member.edu_12th_mark && (
                    <p className="edu-score">Marks: {member.edu_12th_mark}/{member.edu_12th_total}</p>
                  )}
                </div>

                {/* 10th Section */}
                <div className="edu-card secondary">
                  <div className="edu-header">
                    <h4>Secondary (10th)</h4>
                    <span className="edu-year">{member.edu_10th_year || '—'}</span>
                  </div>
                  <p className="edu-school">{member.edu_10th_school || '—'}</p>
                  {member.edu_10th_mark && (
                    <p className="edu-score">Marks: {member.edu_10th_mark}/{member.edu_10th_total}</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        );
      case 'Schedule':
        return (
          <div className="animate-fade-in">
            <section className="profile-section">
              <div className="section-header">
                <h3>Upcoming Schedule</h3>
              </div>
              <div className="schedule-table-wrapper">
                <table className="schedule-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time Slot</th>
                      <th>Patient</th>
                      <th>Machine</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.length > 0 ? (
                      appointments.map((appt) => (
                        <tr key={appt.id}>
                          <td className="font-medium">{new Date(appt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                          <td>{appt.time_slot}</td>
                          <td>
                            <div className="patient-link" onClick={() => navigate(`/patients/${appt.patient}`)}>
                              {appt.patient_name || 'Unknown Patient'}
                            </div>
                          </td>
                          <td>
                            <span className="machine-tag">M-{appt.machine_unit || appt.machine}</span>
                          </td>
                          <td>
                            <span className={`status-pill ${appt.status.toLowerCase()}`}>
                              {appt.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="empty-state">
                          No upcoming appointments scheduled for this staff member.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        );
      case 'Documents':
        const docs = [
          { name: 'ID Proof', file: member.id_proof },
          { name: 'Qualification Certificate', file: member.qualification_proof }
        ].filter(doc => doc.file);

        return (
          <div className="animate-fade-in">
            <section className="profile-section">
              <h3>Employee Documents</h3>
              <div className="docs-grid">
                {docs.length > 0 ? (
                  docs.map((doc, idx) => (
                    <a
                      key={idx}
                      href={getFullImageUrl(doc.file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="doc-item card clickable-doc"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div className="doc-icon-wrapper">
                        <FileText size={24} className="doc-icon" />
                      </div>
                      <div className="doc-info">
                        <p className="doc-name">{doc.name}</p>
                        <p className="doc-meta">Click to view document</p>
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="doc-item card">
                    <FileText size={24} className="doc-icon" />
                    <div className="doc-info">
                      <p className="doc-name">No documents uploaded</p>
                      <p className="doc-meta">Use the staff records system to attach documents.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="profile-page-container animate-fade-in">
      <header className="profile-nav-header">
        <button onClick={() => navigate('/staff')} className="back-btn">
          <ArrowLeft size={20} /> Back to Staff
        </button>
      </header>

      <div className="profile-stats-row">
        {stats.map((s) => (
          <div key={s.label} className="stat-box card">
            <div className="stat-content">
              <p className="stat-label">{s.label}</p>
              <p className="stat-val">{s.value}</p>
            </div>
            <div className={`stat-icon-circle ${s.color}`}>{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="profile-layout">
        <aside className="profile-sidebar">
          <div className="card profile-main-card">
            <div className="profile-avatar-large">
              <img src={avatarUrl} alt={member.name} />
              <span className={`status-tag ${statusClass}`}>{statusLabel}</span>
            </div>
            <div className="profile-basic-info">
              <h1>{member.name}</h1>
              <p className="role-text">{member.role}</p>
            </div>
            <div className="profile-contact-list">
              <div className="contact-row">
                <Mail size={16} />
                <span>{member.email || '—'}</span>
              </div>
              <div className="contact-row">
                <Phone size={16} />
                <span>{member.phone || '—'}</span>
              </div>
              <div className="contact-row">
                <MapPin size={16} />
                <span>Dialysis Center</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="profile-main-content">
          <div className="card content-card">
            <div className="card-header-tabs">
              {['Overview', 'Schedule', 'Documents'].map((tab) => (
                <button
                  key={tab}
                  className={`tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="tab-content">{renderTabContent()}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffProfile;
