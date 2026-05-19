import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, Monitor, User, Search, Check, AlertCircle } from 'lucide-react';
import { patientService, appointmentService, staffService } from '../../services/api';
import './BookingModal.css';

const BookingModal = ({ isOpen, onClose, slotData, onRefresh, machines = [], appointments = [] }) => {
  const [step, setStep] = useState(1);
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedDate, setSelectedDate] = useState(slotData?.date || new Date().toISOString().split('T')[0]);
  const [selectedMachine, setSelectedMachine] = useState(slotData?.machineId || '');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(slotData?.slotLabel || '');
  const [attendingStaff, setAttendingStaff] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [allStaff, setAllStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isMachineDropdownOpen, setIsMachineDropdownOpen] = useState(false);
  const dateInputRef = useRef(null);
  const machineDropdownRef = useRef(null);

  const timeSlots = [
    '07:30 AM - 11:30 AM',
    '12:00 PM - 04:00 PM'
  ];

  useEffect(() => {
    if (isOpen) {
      fetchPatients();
      fetchStaff();
      if (slotData) {
        setSelectedDate(slotData.date);
        setSelectedMachine(String(slotData.machineId));
        setSelectedTimeSlot(slotData.slotLabel);
        
        if (slotData.editMode && slotData.appointment) {
          const appt = slotData.appointment;
          setSelectedPatient({
            id: appt.patient,
            full_name: appt.patient_name,
            patient_id: appt.patient_id_label || '?',
            hiv_status: appt.is_hiv,
            hepatitis_c: appt.is_hcv
          });
          setAttendingStaff(appt.attending_staff || '');
          setSelectedStaff(appt.attending_staff || '');
          setSelectedStaffId(appt.staff || null);
        } else {
          setSelectedPatient(null);
          setSearch('');
          setAttendingStaff('');
          setSelectedStaff('');
          setSelectedStaffId(null);
        }
        setStep(1);
      } else {
        setStep(1);
        setSelectedPatient(null);
        setSearch('');
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setSelectedMachine('');
        setSelectedTimeSlot('');
        setAttendingStaff('');
        setSelectedStaff('');
        setSelectedStaffId(null);
      }
      setSuccess(false);
      setIsMachineDropdownOpen(false);
    }
  }, [isOpen, slotData]);

  // Auto-link staff ID if name matches exactly
  useEffect(() => {
    if (attendingStaff && allStaff.length > 0 && !selectedStaffId) {
      const match = allStaff.find(s => 
        (s.name || '').toLowerCase() === attendingStaff.toLowerCase() ||
        (`${s.first_name} ${s.last_name}`).toLowerCase() === attendingStaff.toLowerCase()
      );
      if (match) {
        setSelectedStaffId(match.id);
      }
    }
  }, [attendingStaff, allStaff, selectedStaffId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (machineDropdownRef.current && !machineDropdownRef.current.contains(event.target)) {
        setIsMachineDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await staffService.getAll();
      setAllStaff(response.data);
    } catch (error) {
      console.error('Error fetching staff:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await patientService.getAll();
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const getSlotAvailability = (slotLabel) => {
    if (!machines || machines.length === 0) return { booked: 0, total: 0, available: -1 };
    
    // In edit mode, we don't count the current appointment as a conflict
    const bookedCount = appointments.filter(a =>
      a.date === selectedDate &&
      a.time_slot === slotLabel &&
      (!slotData?.editMode || a.id !== slotData?.appointment?.id)
    ).length;

    return {
      booked: bookedCount,
      total: machines.length,
      available: Math.max(0, machines.length - bookedCount)
    };
  };

  const filteredPatients = patients.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(search.toLowerCase())
  );

  const checkCompatibility = (patient, machineId) => {
    if (!patient || !machineId) return { compatible: true };
    const machine = machines.find(m => m.id === parseInt(machineId));
    if (!machine) return { compatible: true };

    const isPatientHiv = !!patient.hiv_status;
    const isPatientHcv = !!patient.hepatitis_c;
    const machineType = machine.type;

    if (isPatientHiv) {
      if (machineType === 'HIV' || machineType === 'HIV_HCV') return { compatible: true };
      return { compatible: false, message: 'HIV+ patient requires an HIV-dedicated machine.' };
    }

    if (isPatientHcv) {
      if (machineType === 'HCV' || machineType === 'HIV_HCV') return { compatible: true };
      return { compatible: false, message: 'HCV+ patient requires an HCV-dedicated machine.' };
    }

    if (machineType !== 'Standard') {
      return { compatible: false, message: 'Standard patient cannot use HIV/HCV dedicated machines.' };
    }

    return { compatible: true };
  };

  const [error, setError] = useState(null);

  const handleBook = async () => {
    if (!selectedPatient || !selectedMachine || !selectedDate || !selectedTimeSlot) {
      setError('Please complete patient, machine, date and time slot before confirming.');
      return;
    }

    const { compatible, message } = checkCompatibility(selectedPatient, selectedMachine);
    if (!compatible) {
      setError(message || 'Selected machine is not compatible with this patient.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const bookingData = {
        patient: selectedPatient.id,
        machine: parseInt(selectedMachine, 10),
        date: selectedDate,
        time_slot: selectedTimeSlot,
        staff: selectedStaffId,
        attending_staff: attendingStaff,
        status: 'Upcoming'
      };

      if (slotData?.editMode && slotData.appointment) {
        await appointmentService.update(slotData.appointment.id, bookingData);
      } else {
        await appointmentService.create(bookingData);
      }

      setSuccess(true);
      onRefresh();
      setTimeout(() => {
        onClose();
        setStep(1);
      }, 3000);
    } catch (err) {
      console.error('Error booking session:', err);
      const data = err.response?.data;
      const flatten = (val) => Array.isArray(val) ? val.join(' ') : val;
      let msg;
      if (data) {
        if (data.patient) msg = flatten(data.patient);
        else if (data.non_field_errors) msg = flatten(data.non_field_errors);
        else if (data.detail) msg = flatten(data.detail);
        else if (typeof data === 'object') {
          msg = Object.entries(data).map(([k, v]) => `${k}: ${flatten(v)}`).join(' • ');
        }
      }
      setError(msg || 'Failed to book session. Please check machine availability or try a different slot.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) setError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => dateInputRef.current?.blur()}>
      <div className={`booking-modal-content animate-pop ${success ? 'success-mode' : ''}`} onClick={() => dateInputRef.current?.blur()}>
        {!success ? (
          <>
            <header className="booking-header">
              <div className="header-title">
                <Calendar size={20} color="#0ea5e9" />
                <h2>{slotData?.editMode ? 'Edit Session Allocation' : 'New Session Allocation'}</h2>
              </div>
              <button className="close-modal-btn" onClick={onClose}><X size={20} /></button>
            </header>

            {error && (
              <div className="error-alert-banner animate-fade-in" style={{ margin: '0 2rem 1rem' }}>
                <AlertCircle size={20} />
                <div className="error-text-box">
                  <strong>Action Required</strong>
                  <p>{error}</p>
                </div>
                <button className="error-close-btn" onClick={() => setError(null)}><X size={16} /></button>
              </div>
            )}

            <div className="booking-body">
              {step === 1 && (
                <div className="step-content animate-fade-in">
                  <div className="patient-selector">
                    <label>Search & Select Patient</label>
                    <div className="search-box-modal">
                      <Search size={18} />
                      <input
                        type="text"
                        placeholder="Search patient name or ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                    {search && search.trim() !== "" && (
                      <div className="patient-cards-selection">
                        {filteredPatients.map(patient => (
                          <div
                            key={patient.id}
                            className={`patient-selection-card ${selectedPatient?.id === patient.id ? 'active' : ''}`}
                            onClick={() => {
                              setSelectedPatient(patient);
                              setSearch('');
                            }}
                          >
                            <div className="card-p-header">
                              <span className="card-p-name">{patient.full_name}</span>
                              {selectedPatient?.id === patient.id && <div className="selected-indicator"><Check size={14} color="white" /></div>}
                            </div>
                            <div className="card-p-details">
                              <span className="card-p-id">#{patient.patient_id}</span>
                              <span className="dot-separator">•</span>
                              <span className="card-p-type">{patient.hiv_status ? 'HIV +' : 'Standard'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {selectedPatient && !search && (
                    <div className="selected-patient-display animate-pop">
                      <div className="card-p-header">
                        <span className="card-p-name">{selectedPatient.full_name}</span>
                        <button className="change-patient-btn" onClick={() => setSelectedPatient(null)}>Change</button>
                      </div>
                      <div className="card-p-details">
                        <span className="card-p-id">#{selectedPatient.patient_id}</span>
                        <span className="dot-separator">•</span>
                        <span className="card-p-type">{selectedPatient.hiv_status ? 'HIV +' : 'Standard'}</span>
                      </div>
                    </div>
                  )}

                  <div className="machine-selector-step1" ref={machineDropdownRef}>
                    <label>Select Machine Unit</label>
                    <div 
                      className={`custom-machine-dropdown ${isMachineDropdownOpen ? 'open' : ''}`}
                      onClick={() => setIsMachineDropdownOpen(!isMachineDropdownOpen)}
                    >
                      <div className="selected-value">
                        {selectedMachine ? (
                          <>
                            <Monitor size={18} />
                            <span>Unit {machines.find(m => m.id === parseInt(selectedMachine))?.unit_number}</span>
                          </>
                        ) : (
                          <span className="placeholder">Choose a unit...</span>
                        )}
                      </div>
                      <Monitor size={18} className="chevron" />
                      
                      {isMachineDropdownOpen && (
                        <div className="machine-options-list animate-fade-in">
                          {machines.map(m => {
                            const isOutOfService = m.status === 'Maintenance' || m.status === 'Out of Service';
                            const { compatible, message } = checkCompatibility(selectedPatient, m.id);
                            
                            return (
                              <div 
                                key={m.id} 
                                className={`machine-option-item ${selectedMachine === String(m.id) ? 'selected' : ''} ${isOutOfService ? 'disabled' : ''} ${!compatible ? 'mismatch' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isOutOfService) {
                                    setSelectedMachine(String(m.id));
                                    setIsMachineDropdownOpen(false);
                                  }
                                }}
                              >
                                <div className="m-main-info">
                                  <Monitor size={16} />
                                  <span className="m-name">Unit {m.unit_number}</span>
                                  <span className="m-type">({m.type})</span>
                                </div>
                                {isOutOfService ? (
                                  <span className={`status-badge ${m.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                    {m.status}
                                  </span>
                                ) : (selectedPatient && !compatible) && (
                                  <span className="status-badge incompatible" title={message}>Incompatible</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="attending-staff-selector animate-pop">
                    <label>Attending Clinician / Staff</label>
                    <div className="search-box-modal">
                      <User size={18} />
                      <input
                        type="text"
                        placeholder="Search clinician name..."
                        value={attendingStaff}
                        onChange={(e) => {
                          setAttendingStaff(e.target.value);
                          setSelectedStaff('');
                        }}
                      />
                    </div>
                    {attendingStaff && !selectedStaff && (
                      <div className="staff-dropdown animate-fade-in">
                        {allStaff
                          .filter(s => (s.name || '').toLowerCase().includes(attendingStaff.toLowerCase()) || 
                                       (`${s.first_name} ${s.last_name}`).toLowerCase().includes(attendingStaff.toLowerCase()))
                          .map(staff => {
                            const displayName = staff.name || `${staff.first_name} ${staff.last_name}`;
                            return (
                              <div key={staff.id} 
                                className="staff-option" 
                                onClick={() => { 
                                  setAttendingStaff(displayName); 
                                  setSelectedStaff(displayName); 
                                  setSelectedStaffId(staff.id);
                                }}
                              >
                                <User size={14} />
                                <span>{displayName} <small style={{ opacity: 0.6, fontSize: '0.7em' }}>({staff.role})</small></span>
                              </div>
                            );
                          })
                        }
                        {allStaff.filter(s => (s.name || '').toLowerCase().includes(attendingStaff.toLowerCase()) || 
                                              (`${s.first_name} ${s.last_name}`).toLowerCase().includes(attendingStaff.toLowerCase())).length === 0 && (
                          <div className="staff-option disabled">No staff found</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="step-content animate-fade-in">
                  <div className="booking-form-grid">
                    <div className="form-group custom-date-selector">
                      <label><Calendar size={16} /> Select Date</label>
                      <div className="date-select-row">
                        <select
                          className="modal-select day"
                          value={selectedDate ? selectedDate.split('-')[2] : ''}
                          onChange={(e) => {
                            const parts = selectedDate.split('-');
                            setSelectedDate(`${parts[0]}-${parts[1]}-${e.target.value.padStart(2, '0')}`);
                          }}
                        >
                          {Array.from({ length: 31 }, (_, i) => (
                            <option key={i + 1} value={String(i + 1).padStart(2, '0')}>{i + 1}</option>
                          ))}
                        </select>
                        <select
                          className="modal-select month"
                          value={selectedDate ? selectedDate.split('-')[1] : ''}
                          onChange={(e) => {
                            const parts = selectedDate.split('-');
                            setSelectedDate(`${parts[0]}-${e.target.value}-${parts[2]}`);
                          }}
                        >
                          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                            <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>
                          ))}
                        </select>
                        <select
                          className="modal-select year"
                          value={selectedDate ? selectedDate.split('-')[0] : ''}
                          onChange={(e) => {
                            const parts = selectedDate.split('-');
                            setSelectedDate(`${e.target.value}-${parts[1]}-${parts[2]}`);
                          }}
                        >
                          {[2024, 2025, 2026, 2027].map(y => (
                            <option key={y} value={String(y)}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label><Clock size={16} /> Available Time Slots</label>
                      <div className="time-slots-grid">
                        {timeSlots.map(slot => {
                          const availability = getSlotAvailability(slot);
                          const isFull = availability.available === 0;
                          const isChecking = availability.available === -1;
                          return (
                            <div
                              key={slot}
                              className={`time-slot-chip ${selectedTimeSlot === slot ? 'selected' : ''} ${isFull ? 'full' : ''} ${isChecking ? 'checking' : ''}`}
                              onClick={() => !isFull && setSelectedTimeSlot(slot)}
                            >
                              <span className="t-time">{slot}</span>
                              <span className="t-status">
                                {isChecking ? 'Checking...' : isFull ? 'Fully Booked' : `${availability.available} Units Free`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="step-content animate-fade-in">
                  <div className="booking-summary-box">
                    <h4>Booking Summary</h4>
                    <div className="summary-row">
                      <span>Patient:</span>
                      <strong>{selectedPatient?.full_name}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Machine Unit:</span>
                      <strong>Unit {machines.find(m => m.id === parseInt(selectedMachine))?.unit_number || selectedMachine}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Attending Staff:</span>
                      <strong>{attendingStaff || '—'}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Schedule:</span>
                      <strong>{selectedDate} • {selectedTimeSlot}</strong>
                    </div>
                    {(() => {
                      const compat = checkCompatibility(selectedPatient, selectedMachine);
                      return !compat.compatible ? (
                        <div style={{ background: '#fef2f2', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <AlertCircle size={16} />
                          <strong>{compat.message}</strong>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </div>
              )}
            </div>

            <footer className="booking-footer">
              {step > 1 && (
                <button className="back-btn" onClick={() => setStep(step - 1)}>Back</button>
              )}
              <div className="footer-right">
                <button className="cancel-link" onClick={onClose}>Cancel</button>
                {step < 3 ? (
                  <button
                    className="confirm-book-btn"
                    disabled={step === 1 ? (!selectedPatient || !selectedMachine) : step === 2 ? (!selectedDate || !selectedTimeSlot) : false}
                    onClick={() => setStep(step + 1)}
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    className="confirm-book-btn"
                    disabled={
                      !selectedMachine ||
                      !selectedPatient ||
                      !selectedDate ||
                      !selectedTimeSlot ||
                      loading ||
                      !checkCompatibility(selectedPatient, selectedMachine).compatible
                    }
                    onClick={handleBook}
                  >
                    {loading ? 'Confirming...' : 'Confirm Allocation'}
                  </button>
                )}
              </div>
            </footer>
          </>
        ) : (
          <div className="success-step animate-fade-in">
            <div className="success-icon-wrapper">
              <Check size={48} color="white" />
            </div>
            <h3>Booking Confirmed!</h3>
            <p>A confirmation message has been sent to <strong>{selectedPatient?.full_name}</strong>'s mobile number.</p>
            <div className="sms-simulation">
              <div className="sms-bubble">
                "Hello {selectedPatient?.full_name}, your Dialysis session is scheduled for {selectedDate} at {selectedTimeSlot} on Unit {selectedMachine}. See you then!"
              </div>
            </div>
            <button className="done-btn" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
