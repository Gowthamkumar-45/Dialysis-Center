import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, Monitor, User, Search, Check } from 'lucide-react';
import { patientService, appointmentService } from '../../services/api';
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
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isMachineDropdownOpen, setIsMachineDropdownOpen] = useState(false);
  const dateInputRef = useRef(null);
  const machineDropdownRef = useRef(null);

  const timeSlots = [
    '08:00 AM - 11:00 AM',
    '11:30 AM - 02:30 PM',
    '03:00 PM - 06:00 PM',
    '06:30 PM - 09:30 PM'
  ];

  useEffect(() => {
    if (isOpen) {
      fetchPatients();
      if (slotData) {
        setSelectedDate(slotData.date);
        setSelectedMachine(slotData.machineId);
        setSelectedTimeSlot(slotData.slotLabel);
        setAttendingStaff('');
        setSelectedStaff('');
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
      }
      setSuccess(false);
      setIsMachineDropdownOpen(false);
    }
  }, [isOpen, slotData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (machineDropdownRef.current && !machineDropdownRef.current.contains(event.target)) {
        setIsMachineDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await patientService.getAll();
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const getSlotAvailability = (slotLabel) => {
    // If no machines found in the system yet
    if (!machines || machines.length === 0) return { booked: 0, total: 0, available: -1 };

    const bookedCount = appointments.filter(a =>
      a.date === selectedDate &&
      a.time_slot === slotLabel
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

  const handleBook = async () => {
    setLoading(true);
    try {
      const bookingData = {
        patient: selectedPatient.id,
        machine: selectedMachine,
        date: selectedDate,
        time_slot: selectedTimeSlot,
        attending_staff: attendingStaff,
        status: 'Upcoming'
      };

      await appointmentService.create(bookingData);
      setSuccess(true);
      onRefresh();
      // Auto close after 2 seconds on success
      setTimeout(() => {
        onClose();
        setStep(1);
      }, 3000);
    } catch (error) {
      console.error('Error booking session:', error);
      alert('Failed to book session. Please check availability.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => dateInputRef.current?.blur()}>
      <div
        className={`booking-modal-content animate-pop ${success ? 'success-mode' : ''}`}
        onClick={() => dateInputRef.current?.blur()}
      >
        {!success ? (
          <>
            <header className="booking-header">
              <div className="title-area">
                <h2>Book Dialysis Session</h2>
                <div className="step-indicator">Step {step} of 3</div>
              </div>
              <button className="close-btn-round" onClick={onClose}><X size={20} /></button>
            </header>

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
                            const isUnavailable = m.status === 'Maintenance' || m.status === 'Out of Service';
                            return (
                              <div 
                                key={m.id} 
                                className={`machine-option-item ${selectedMachine === String(m.id) ? 'selected' : ''} ${isUnavailable ? 'disabled' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isUnavailable) {
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
                                {isUnavailable && (
                                  <span className={`status-badge ${m.status.toLowerCase().replace(/\s+/g, '-')}`}>
                                    {m.status}
                                  </span>
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
                          setSelectedStaff(''); // clear so dropdown re-appears
                        }}
                      />
                    </div>
                    {attendingStaff && !selectedStaff && (
                      <div className="staff-dropdown animate-fade-in">
                        {['Dr. Sarah Wilson', 'Dr. James Miller', 'RN Mark Thompson', 'RN Elena Cruz', 'RN Priya Sharma', 'Tech David Chen']
                          .filter(s => s.toLowerCase().includes(attendingStaff.toLowerCase()))
                          .map(staff => (
                            <div
                              key={staff}
                              className="staff-option"
                              onClick={() => {
                                setAttendingStaff(staff);
                                setSelectedStaff(staff);
                              }}
                            >
                              <User size={14} />
                              <span>{staff}</span>
                            </div>
                          ))
                        }
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
                      <strong>{attendingStaff}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Schedule:</span>
                      <strong>{selectedDate} • {selectedTimeSlot}</strong>
                    </div>
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
                    disabled={step === 1 ? !selectedPatient : step === 2 ? (!selectedDate || !selectedTimeSlot) : false}
                    onClick={() => setStep(step + 1)}
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    className="confirm-book-btn"
                    disabled={!selectedMachine || loading}
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
