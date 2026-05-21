import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MoreVertical, Plus, Search, X, Edit2, Trash2, User, Briefcase, Activity, Camera, RotateCcw, Scan, Upload, GraduationCap, FileText, Users, Hash, School, Award, BookOpen, Calendar } from 'lucide-react';
import { staffService, getFullImageUrl } from '../../services/api';
import './Staff.css';

const DEFAULT_STAFF = {
  first_name: '',
  last_name: '',
  age: '',
  gender: 'Male',
  role: 'Doctor',
  email: '',
  phone: '',
  is_on_duty: true,
  staff_photo: null,
  education: '',
  // 10th Standard
  edu_10th_school: '', edu_10th_mark: '', edu_10th_total: '', edu_10th_year: '',
  // 12th Standard
  edu_12th_school: '', edu_12th_mark: '', edu_12th_total: '', edu_12th_year: '',
  // UG
  edu_ug_college: '', edu_ug_degree: '', edu_ug_mark: '', edu_ug_total: '', edu_ug_year: '',
  // PG
  edu_pg_college: '', edu_pg_degree: '', edu_pg_mark: '', edu_pg_total: '', edu_pg_year: '',
  id_proof: null,
  qualification_proof: null,
  bio: '',
};

const Staff = () => {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [liveStream, setLiveStream] = useState(null); 
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Staff');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [currentStaff, setCurrentStaff] = useState(DEFAULT_STAFF);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('Identity');
  const [showPG, setShowPG] = useState(false);

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
      setLiveStream(stream);
      setCameraActive(true);
      setCapturedPhoto(null);
    } catch (err) {
      console.error('Camera error:', err);
      alert('Could not access camera. Please allow camera permission.');
    }
  }, []);

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
      const file = new File([blob], 'staff_photo.jpg', { type: 'image/jpeg' });
      setCurrentStaff(prev => ({ ...prev, staff_photo: file }));
    }, 'image/jpeg', 0.9);
    stopStream();
    setCameraActive(false);
  }, [stopStream]);

  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    setCurrentStaff(prev => ({ ...prev, staff_photo: null }));
    openCamera();
  }, [openCamera]);

  useEffect(() => {
    if (!showModal) stopStream();
  }, [showModal, stopStream]);
  // ────────────────────────────────────────────────────────────────

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const response = await staffService.getAll();
      setStaffMembers(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleNextTab = () => {
    if (activeTab === 'Identity') setActiveTab('Education');
    else if (activeTab === 'Education') setActiveTab('Documents');
  };

  const handlePrevTab = () => {
    if (activeTab === 'Education') setActiveTab('Identity');
    else if (activeTab === 'Documents') setActiveTab('Education');
  };

  const handleOpenAdd = () => {
    setModalMode('add');
    setCurrentStaff(DEFAULT_STAFF);
    setCapturedPhoto(null);
    setActiveTab('Identity');
    setShowPG(false);
    setShowModal(true);
  };

  const handleOpenEdit = async (member) => {
    try {
      const response = await staffService.getById(member.id);
      const fullMember = response.data;
      
      setModalMode('edit');
      setCurrentStaff({
        ...DEFAULT_STAFF,
        ...fullMember,
        is_on_duty: !!fullMember.is_on_duty,
        education: fullMember.education || '',
        first_name: fullMember.first_name || fullMember.name?.split(' ')[0] || '',
        last_name: fullMember.last_name || fullMember.name?.split(' ').slice(1).join(' ') || '',
        age: fullMember.age !== undefined && fullMember.age !== null ? fullMember.age : '',
        gender: fullMember.gender || 'Male',
        // Explicitly map education fields to handle nulls from database
        edu_10th_school: fullMember.edu_10th_school || '',
        edu_10th_mark: fullMember.edu_10th_mark || '',
        edu_10th_total: fullMember.edu_10th_total || '',
        edu_10th_year: fullMember.edu_10th_year || '',
        edu_12th_school: fullMember.edu_12th_school || '',
        edu_12th_mark: fullMember.edu_12th_mark || '',
        edu_12th_total: fullMember.edu_12th_total || '',
        edu_12th_year: fullMember.edu_12th_year || '',
        edu_ug_college: fullMember.edu_ug_college || '',
        edu_ug_degree: fullMember.edu_ug_degree || '',
        edu_ug_mark: fullMember.edu_ug_mark || '',
        edu_ug_total: fullMember.edu_ug_total || '',
        edu_ug_year: fullMember.edu_ug_year || '',
        edu_pg_college: fullMember.edu_pg_college || '',
        edu_pg_degree: fullMember.edu_pg_degree || '',
        edu_pg_mark: fullMember.edu_pg_mark || '',
        edu_pg_total: fullMember.edu_pg_total || '',
        edu_pg_year: fullMember.edu_pg_year || '',
      });
      const existingPhoto = fullMember.staff_photo || fullMember.avatar_url || fullMember.photo || fullMember.image || fullMember.profile_photo;
      setCapturedPhoto(existingPhoto ? getFullImageUrl(existingPhoto) : null);
      setActiveTab('Identity');
      setShowPG(!!(fullMember.edu_pg_college || fullMember.edu_pg_degree));
      setShowModal(true);
      setActiveMenuId(null);
    } catch (error) {
      console.error('Error fetching staff details:', error);
      alert('Failed to load complete staff details. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await staffService.delete(id);
      setActiveMenuId(null);
      fetchStaff();
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert('Failed to delete staff member.');
    }
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // STRICT GUARD: If not on the final tab, trigger navigation instead of submission
    if (activeTab !== 'Documents') {
      handleNextTab();
      return;
    }
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('first_name', currentStaff.first_name);
      formData.append('last_name', currentStaff.last_name);
      formData.append('name', `${currentStaff.first_name} ${currentStaff.last_name}`.trim());
      formData.append('age', currentStaff.age);
      formData.append('gender', currentStaff.gender);
      formData.append('role', currentStaff.role);
      formData.append('email', currentStaff.email);
      formData.append('phone', currentStaff.phone);
      formData.append('education', currentStaff.education);
      formData.append('bio', currentStaff.bio || '');
      // Append detailed education fields
      const eduFields = [
        'edu_10th_school', 'edu_10th_mark', 'edu_10th_total', 'edu_10th_year',
        'edu_12th_school', 'edu_12th_mark', 'edu_12th_total', 'edu_12th_year',
        'edu_ug_college', 'edu_ug_degree', 'edu_ug_mark', 'edu_ug_total', 'edu_ug_year',
        'edu_pg_college', 'edu_pg_degree', 'edu_pg_mark', 'edu_pg_total', 'edu_pg_year'
      ];
      eduFields.forEach(field => {
        if (currentStaff[field]) formData.append(field, currentStaff[field]);
      });
      
      formData.append('is_on_duty', !!currentStaff.is_on_duty);

      if (currentStaff.staff_photo instanceof File) {
        formData.append('staff_photo', currentStaff.staff_photo);
      }
      if (currentStaff.id_proof instanceof File) {
        formData.append('id_proof', currentStaff.id_proof);
      }
      if (currentStaff.qualification_proof instanceof File) {
        formData.append('qualification_proof', currentStaff.qualification_proof);
      }

      if (modalMode === 'add') {
        await staffService.create(formData);
      } else {
        await staffService.update(currentStaff.id, formData);
      }
      setShowModal(false);
      fetchStaff();
    } catch (error) {
      console.error('Error saving staff:', error);
      const data = error.response?.data;
      const msg = data
        ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n')
        : 'Failed to save staff. Please check the inputs.';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const filteredStaff = staffMembers.filter((member) => {
    const name = member.name || '';
    const email = member.email || '';
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

    const roleMap = {
      Doctors: 'Doctor',
      Nurses: 'Nurse',
      Technicians: 'Technician',
      Support: 'Support',
    };

    return matchesSearch && (activeFilter === 'All Staff' || member.role === roleMap[activeFilter]);
  });

  const statusLabel = (m) => (m.is_on_duty ? 'On Duty' : 'Off Duty');
  const statusClass = (m) => (m.is_on_duty ? 'on-duty' : 'off-duty');

  const avatarFor = (member) => {
    // Highly resilient check for multiple possible field names
    const photoUrl = member.staff_photo || member.avatar_url || member.photo || member.image || member.profile_photo;
    return (
      getFullImageUrl(photoUrl) ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(member.first_name || member.name || 'staff')}`
    );
  };

  return (
    <div className="staff-container animate-fade-in" onClick={() => setActiveMenuId(null)}>
      <header className="staff-header">
        <button
          className="add-staff-btn shadow-lg shadow-sky-100 hover:scale-105 transition-transform"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenAdd();
          }}
        >
          <Plus size={20} />
          <span>Add Staff Member</span>
        </button>
      </header>

      <div className="staff-controls">
        <div className="search-staff">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="role-filters">
          <label className="filter-label">ROLE:</label>
          <select
            className="role-select"
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
          >
            {['All Staff', 'Doctors', 'Nurses', 'Technicians', 'Support'].map((filter) => (
              <option key={filter} value={filter}>
                {filter}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Loading staff...</div>
      ) : filteredStaff.length === 0 ? (
        <div className="empty-state-container">
          <div className="empty-state-card">
            <Users size={48} className="empty-state-icon" />
            <h4>No Staff Members Found</h4>
            <p>
              {searchTerm || activeFilter !== 'All Staff'
                ? 'No matching staff members found with the current filters.'
                : 'No staff members registered in the system yet. Click Add Staff Member to register one.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="staff-grid">
          {filteredStaff.map((member) => (
            <div key={member.id} className="staff-card card border-slate-200 hover:border-sky-200">
              <div className="staff-card-header">
                <div className="staff-avatar shadow-sm">
                  <img src={avatarFor(member)} alt={member.name} />
                  <span className={`status-indicator ${statusClass(member)}`}></span>
                </div>
                <div className="action-container">
                  <button
                    className={`more-btn ${activeMenuId === member.id ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(activeMenuId === member.id ? null : member.id);
                    }}
                  >
                    <MoreVertical size={18} />
                  </button>
                  {activeMenuId === member.id && (
                    <div className="action-dropdown card animate-pop" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleOpenEdit(member)}>
                        <Edit2 size={14} /> Edit Details
                      </button>
                      <button className="delete-action" onClick={() => handleDelete(member.id)}>
                        <Trash2 size={14} /> Remove Staff
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="staff-info">
                <h3 className="text-slate-800">{member.first_name && member.last_name ? `${member.first_name} ${member.last_name}` : member.name}</h3>
                <span className="staff-role uppercase tracking-wider text-[10px]">{member.role}</span>
              </div>
              <div className="staff-contact">
                <div className="contact-item">
                  <Mail size={14} className="text-sky-400" />
                  <span className="truncate">{member.email || '—'}</span>
                </div>
                <div className="contact-item">
                  <Phone size={14} className="text-sky-400" />
                  <span>{member.phone || '—'}</span>
                </div>
                <div className="contact-item">
                  <span className={`status-pill ${statusClass(member)}`}>{statusLabel(member)}</span>
                </div>
              </div>
              <div className="staff-footer">
                <button
                  className="view-profile-btn hover:bg-slate-100 transition-colors"
                  onClick={() => navigate(`/staff/${member.id}`)}
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content card animate-pop" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'add' ? 'Add New Staff' : 'Edit Staff Details'}</h2>
              <button onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-tabs">
              {['Identity', 'Education', 'Documents'].map(tab => (
                <button 
                  key={tab} 
                  type="button"
                  className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="staff-form">
              <div className="form-body">
                {activeTab === 'Identity' && (
                  <div className="animate-fade-in tab-content">
                    <div className="form-group full-width">
                      <label><Camera size={16} className="text-sky-400 mr-2" /> Staff Profile Photo</label>
                      <div className="photo-capture-section">
                        {!cameraActive && !capturedPhoto && (
                          <div className="photo-options">
                            <button type="button" className="staff-photo-trigger" onClick={openCamera}>
                              <Camera size={18} /> Take Photo
                            </button>
                            <div className="photo-divider"><span>OR</span></div>
                            <label className="upload-btn">
                              <Upload size={18} /> Upload from Device
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    setCurrentStaff(prev => ({ ...prev, staff_photo: file }));
                                    const reader = new FileReader();
                                    reader.onloadend = () => setCapturedPhoto(reader.result);
                                    reader.readAsDataURL(file);
                                  }
                                }} 
                                hidden 
                              />
                            </label>
                          </div>
                        )}

                        {cameraActive && (
                          <div className="camera-view">
                            <video ref={videoRef} autoPlay playsInline muted className="live-video" />
                            <div className="camera-controls">
                              <button type="button" className="staff-snap-btn" onClick={capturePhoto}>
                                <Scan size={20} /> Capture
                              </button>
                              <button type="button" className="cancel-snap" onClick={() => { stopStream(); setCameraActive(false); }}>
                                <X size={20} />
                              </button>
                            </div>
                          </div>
                        )}

                        {capturedPhoto && !cameraActive && (
                          <div className="photo-preview-container">
                            <img src={capturedPhoto} alt="Captured" className="photo-preview" />
                            <button type="button" className="retake-btn" onClick={retakePhoto}>
                              <RotateCcw size={16} /> Change Photo
                            </button>
                          </div>
                        )}
                        <canvas ref={canvasRef} style={{ display: 'none' }} />
                      </div>
                    </div>


                    <div className="form-row">
                      <div className="form-group">
                        <label><User size={16} className="text-sky-400 mr-2" /> First Name</label>
                        <input
                          required
                          type="text"
                          placeholder="John"
                          value={currentStaff.first_name}
                          onChange={(e) => setCurrentStaff({ ...currentStaff, first_name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label><User size={16} className="text-sky-400 mr-2" /> Last Name</label>
                        <input
                          required
                          type="text"
                          placeholder="Doe"
                          value={currentStaff.last_name}
                          onChange={(e) => setCurrentStaff({ ...currentStaff, last_name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label><Hash size={16} className="text-sky-400 mr-2" /> Age</label>
                        <input
                          required
                          type="number"
                          placeholder="30"
                          value={currentStaff.age}
                          onChange={(e) => setCurrentStaff({ ...currentStaff, age: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label><Users size={16} className="text-sky-400 mr-2" /> Gender</label>
                        <select
                          value={currentStaff.gender}
                          onChange={(e) => setCurrentStaff({ ...currentStaff, gender: e.target.value })}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label><Briefcase size={16} className="text-sky-400 mr-2" /> Role</label>
                        <select
                          value={currentStaff.role}
                          onChange={(e) => setCurrentStaff({ ...currentStaff, role: e.target.value })}
                        >
                          <option value="Doctor">Doctor</option>
                          <option value="Nurse">Nurse</option>
                          <option value="Technician">Technician</option>
                          <option value="Support">Support</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label><Activity size={16} className="text-sky-400 mr-2" /> Status</label>
                        <select
                          value={currentStaff.is_on_duty ? 'On Duty' : 'Off Duty'}
                          onChange={(e) =>
                            setCurrentStaff({ ...currentStaff, is_on_duty: e.target.value === 'On Duty' })
                          }
                        >
                          <option>On Duty</option>
                          <option>Off Duty</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label><Mail size={16} className="text-sky-400 mr-2" /> Email Address</label>
                        <input
                          required
                          type="email"
                          placeholder="john@dialycare.com"
                          value={currentStaff.email}
                          onChange={(e) => setCurrentStaff({ ...currentStaff, email: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label><Phone size={16} className="text-sky-400 mr-2" /> Phone Number</label>
                        <input
                          required
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={currentStaff.phone}
                          onChange={(e) => setCurrentStaff({ ...currentStaff, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-group full-width" style={{ marginTop: '1rem' }}>
                      <label><FileText size={16} className="text-sky-400 mr-2" /> About Professional</label>
                      <textarea
                        placeholder="Brief professional summary about the staff member..."
                        value={currentStaff.bio}
                        onChange={(e) => setCurrentStaff({ ...currentStaff, bio: e.target.value })}
                        rows="3"
                        className="form-control"
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem', 
                          borderRadius: '10px', 
                          border: '1px solid #e2e8f0',
                          fontSize: '0.875rem',
                          resize: 'vertical',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'Education' && (
                  <div className="animate-fade-in tab-content education-tab-scroll">
                    <div className="form-group full-width">
                      <label><GraduationCap size={16} className="text-sky-400 mr-2" /> Summary Qualification</label>
                      <input
                        type="text"
                        placeholder="e.g. MBBS, MD (Nephrology), GNM Nursing"
                        value={currentStaff.education}
                        onChange={(e) => setCurrentStaff({ ...currentStaff, education: e.target.value })}
                      />
                    </div>

                    {/* 10th Standard */}
                    <div className="section-title-small"><BookOpen size={14} className="mr-2" /> 10th Standard Details</div>
                    <div className="form-group full-width">
                      <label><School size={16} className="text-sky-400 mr-2" /> School Name</label>
                      <input
                        type="text"
                        placeholder="Enter 10th School Name"
                        value={currentStaff.edu_10th_school}
                        onChange={(e) => setCurrentStaff({ ...currentStaff, edu_10th_school: e.target.value })}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label><Award size={16} className="text-sky-400 mr-2" /> Mark Obtained</label>
                        <input
                          type="number"
                          placeholder="e.g. 450"
                          value={currentStaff.edu_10th_mark}
                          onChange={(e) => setCurrentStaff({ ...currentStaff, edu_10th_mark: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label><Hash size={16} className="text-sky-400 mr-2" /> Total Mark</label>
                        <input
                          type="number"
                          placeholder="e.g. 500"
                          value={currentStaff.edu_10th_total}
                          onChange={(e) => setCurrentStaff({ ...currentStaff, edu_10th_total: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label><Calendar size={16} className="text-sky-400 mr-2" /> Passed Out Year</label>
                        <input
                          type="number"
                          placeholder="2015"
                          value={currentStaff.edu_10th_year}
                          onChange={(e) => setCurrentStaff({ ...currentStaff, edu_10th_year: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* 12th Standard */}
                    <div className="section-title-small"><BookOpen size={14} className="mr-2" /> 12th Standard Details</div>
                    <div className="form-group full-width">
                      <label><School size={16} className="text-sky-400 mr-2" /> School Name</label>
                      <input
                        type="text"
                        placeholder="Enter 12th School Name"
                        value={currentStaff.edu_12th_school}
                        onChange={(e) => setCurrentStaff({ ...currentStaff, edu_12th_school: e.target.value })}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label><Award size={16} className="text-sky-400 mr-2" /> Mark Obtained</label>
                        <input
                          type="number"
                          placeholder="e.g. 1100"
                          value={currentStaff.edu_12th_mark}
                          onChange={(e) => setCurrentStaff({ ...currentStaff, edu_12th_mark: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label><Hash size={16} className="text-sky-400 mr-2" /> Total Mark</label>
                        <input
                          type="number"
                          placeholder="e.g. 1200"
                          value={currentStaff.edu_12th_total}
                          onChange={(e) => setCurrentStaff({ ...currentStaff, edu_12th_total: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label><Calendar size={16} className="text-sky-400 mr-2" /> Passed Out Year</label>
                        <input
                          type="number"
                          placeholder="2017"
                          value={currentStaff.edu_12th_year}
                          onChange={(e) => setCurrentStaff({ ...currentStaff, edu_12th_year: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* UG Details */}
                    <div className="section-title-small"><GraduationCap size={14} className="mr-2" /> Undergraduate (UG) Details</div>
                    <div className="form-row">
                      <div className="form-group" style={{ flex: 2 }}>
                        <label><School size={16} className="text-sky-400 mr-2" /> College Name</label>
                        <input
                          type="text"
                          placeholder="Enter UG College"
                          value={currentStaff.edu_ug_college}
                          onChange={(e) => setCurrentStaff({ ...currentStaff, edu_ug_college: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label><GraduationCap size={16} className="text-sky-400 mr-2" /> Degree</label>
                        <input
                          type="text"
                          placeholder="e.g. B.Sc Nursing"
                          value={currentStaff.edu_ug_degree}
                          onChange={(e) => setCurrentStaff({ ...currentStaff, edu_ug_degree: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label><Award size={16} className="text-sky-400 mr-2" /> Mark/CGPA</label>
                        <input
                          type="text"
                          placeholder="e.g. 8.5"
                          value={currentStaff.edu_ug_mark}
                          onChange={(e) => setCurrentStaff({ ...currentStaff, edu_ug_mark: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label><Hash size={16} className="text-sky-400 mr-2" /> Total</label>
                        <input
                          type="text"
                          placeholder="e.g. 10.0"
                          value={currentStaff.edu_ug_total}
                          onChange={(e) => setCurrentStaff({ ...currentStaff, edu_ug_total: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label><Calendar size={16} className="text-sky-400 mr-2" /> Passed Year</label>
                        <input
                          type="number"
                          placeholder="2021"
                          value={currentStaff.edu_ug_year}
                          onChange={(e) => setCurrentStaff({ ...currentStaff, edu_ug_year: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* PG Details Toggle */}
                    <label className="pg-toggle-container full-width">
                      <input
                        type="checkbox"
                        checked={showPG}
                        onChange={(e) => setShowPG(e.target.checked)}
                      />
                      <span>Add Postgraduate (PG) Details</span>
                    </label>

                    {/* PG Details */}
                    {showPG && (
                      <div className="animate-fade-in tab-content" style={{ gap: '2rem' }}>
                        <div className="section-title-small"><GraduationCap size={14} className="mr-2" /> Postgraduate (PG) Details</div>
                        <div className="form-row">
                          <div className="form-group" style={{ flex: 2 }}>
                            <label><School size={16} className="text-sky-400 mr-2" /> College Name</label>
                            <input
                              type="text"
                              placeholder="Enter PG College"
                              value={currentStaff.edu_pg_college}
                              onChange={(e) => setCurrentStaff({ ...currentStaff, edu_pg_college: e.target.value })}
                            />
                          </div>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label><GraduationCap size={16} className="text-sky-400 mr-2" /> Degree</label>
                            <input
                              type="text"
                              placeholder="e.g. M.Sc"
                              value={currentStaff.edu_pg_degree}
                              onChange={(e) => setCurrentStaff({ ...currentStaff, edu_pg_degree: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="form-row">
                          <div className="form-group">
                            <label><Award size={16} className="text-sky-400 mr-2" /> Mark/CGPA</label>
                            <input
                              type="text"
                              placeholder="e.g. 9.0"
                              value={currentStaff.edu_pg_mark}
                              onChange={(e) => setCurrentStaff({ ...currentStaff, edu_pg_mark: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label><Hash size={16} className="text-sky-400 mr-2" /> Total</label>
                            <input
                              type="text"
                              placeholder="e.g. 10.0"
                              value={currentStaff.edu_pg_total}
                              onChange={(e) => setCurrentStaff({ ...currentStaff, edu_pg_total: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <label><Calendar size={16} className="text-sky-400 mr-2" /> Passed Year</label>
                            <input
                              type="number"
                              placeholder="2023"
                              value={currentStaff.edu_pg_year}
                              onChange={(e) => setCurrentStaff({ ...currentStaff, edu_pg_year: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'Documents' && (
                  <div className="animate-fade-in tab-content">
                    <div className="section-title-small"><FileText size={14} className="mr-2" /> Identity Verification</div>
                    
                    <div className="document-upload-row">
                      <div className="form-group">
                        <label>ID Proof (Aadhar / PAN / DL)</label>
                        <div className="file-upload-wrapper">
                          <input 
                            type="file" 
                            id="id_proof" 
                            onChange={(e) => setCurrentStaff(prev => ({...prev, id_proof: e.target.files[0]}))} 
                            hidden
                          />
                          {currentStaff.id_proof ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '1rem' }}>
                              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {currentStaff.id_proof instanceof File ? currentStaff.id_proof.name : 'ID Proof Uploaded'}
                              </span>
                              <label htmlFor="id_proof" className="upload-btn" style={{ margin: 0, cursor: 'pointer' }}>
                                <Upload size={16} /> Change File
                              </label>
                            </div>
                          ) : (
                            <label htmlFor="id_proof" className="staff-upload-box">
                              <div className="upload-box-content">
                                <Scan size={20} className="text-sky-400" />
                                <span>Upload ID Proof</span>
                              </div>
                            </label>
                          )}
                          {typeof currentStaff.id_proof === 'string' && currentStaff.id_proof && (
                            <div className="existing-doc-hint">
                              <a href={getFullImageUrl(currentStaff.id_proof)} target="_blank" rel="noreferrer">
                                View Current ID Proof
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="section-title-small"><FileText size={14} className="mr-2" /> Professional Certification</div>
                    
                    <div className="document-upload-row">
                      <div className="form-group">
                        <label>Qualification Certificate</label>
                        <div className="file-upload-wrapper">
                          <input 
                            type="file" 
                            id="qualification_proof" 
                            onChange={(e) => setCurrentStaff(prev => ({...prev, qualification_proof: e.target.files[0]}))} 
                            hidden
                          />
                          {currentStaff.qualification_proof ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '1rem' }}>
                              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {currentStaff.qualification_proof instanceof File ? currentStaff.qualification_proof.name : 'Certificate Uploaded'}
                              </span>
                              <label htmlFor="qualification_proof" className="upload-btn" style={{ margin: 0, cursor: 'pointer' }}>
                                <Upload size={16} /> Change File
                              </label>
                            </div>
                          ) : (
                            <label htmlFor="qualification_proof" className="staff-upload-box">
                              <div className="upload-box-content">
                                <GraduationCap size={20} className="text-sky-400" />
                                <span>Upload Certificate</span>
                              </div>
                            </label>
                          )}
                          {typeof currentStaff.qualification_proof === 'string' && currentStaff.qualification_proof && (
                            <div className="existing-doc-hint">
                              <a href={getFullImageUrl(currentStaff.qualification_proof)} target="_blank" rel="noreferrer">
                                View Current Certificate
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <div className="left-actions">
                  {activeTab === 'Identity' && (
                    <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                  )}
                  {activeTab !== 'Identity' && (
                    <button type="button" className="back-btn" onClick={handlePrevTab}>
                      Back
                    </button>
                  )}
                </div>
                
                <div className="right-actions">
                  {activeTab !== 'Documents' ? (
                    <button 
                      type="button" 
                      className="submit-btn" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleNextTab();
                      }}
                    >
                      Next Step
                    </button>
                  ) : (
                    <button type="submit" className="submit-btn" disabled={saving}>
                      {saving ? 'Saving...' : modalMode === 'add' ? 'Register Staff' : 'Update Member'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;
