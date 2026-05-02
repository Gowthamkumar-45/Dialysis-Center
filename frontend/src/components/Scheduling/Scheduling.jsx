import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Monitor, User, ArrowRight, ArrowLeft, CheckCircle2, PlayCircle, AlertCircle } from 'lucide-react';
import { machineService, appointmentService } from '../../services/api';
import BookingModal from './BookingModal';
import SessionReportModal from './SessionReportModal';
import './Scheduling.css';

const Scheduling = () => {
  const [machines, setMachines] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [statusModal, setStatusModal] = useState(null); // { type, unitNum }
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'weekly'

  const timeSlots = [
    '08:00 AM - 11:00 AM',
    '11:30 AM - 02:30 PM',
    '03:00 PM - 06:00 PM',
    '06:30 PM - 09:30 PM'
  ];

  const getLiveStatus = (appt) => {
    if (!appt) return null;
    if (appt.status === 'Completed') return 'Completed';
    
    // Parse the time slot (e.g. "08:00 AM - 11:00 AM")
    const [startStr] = appt.time_slot.split(' - ');
    const now = new Date();
    const [hours, minutes] = startStr.split(':');
    const isPM = startStr.includes('PM');
    
    const startTime = new Date(selectedDate);
    let h = parseInt(hours);
    if (isPM && h !== 12) h += 12;
    if (!isPM && h === 12) h = 0;
    startTime.setHours(h, parseInt(minutes), 0);

    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 3); // Each slot is roughly 3 hours

    if (now >= startTime && now <= endTime) return 'In-Progress';
    if (now > endTime) return 'Overdue';
    return 'Upcoming';
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [machinesRes, apptsRes] = await Promise.all([
        machineService.getAll(),
        appointmentService.getAll()
      ]);
      setMachines(machinesRes.data);
      setAppointments(apptsRes.data);
    } catch (error) {
      console.error('Error fetching scheduling data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getAppointment = (machineId, slotLabel) => {
    return appointments.find(a => 
      a.machine === machineId && 
      a.time_slot === slotLabel && 
      a.date === selectedDate
    );
  };

  const handleSlotClick = (machineId, slotLabel, unitNum) => {
    const existingAppt = getAppointment(machineId, slotLabel);
    const machine = machines.find(m => m.id === machineId);
    
    // Show custom custom status modal
    if (machine?.status === 'Maintenance' || machine?.status === 'Out of Service') {
      setStatusModal({ type: machine.status, unitNum });
      return;
    }

    // Handle Occupied Slots: Open Cancel/Manage Modal
    if (existingAppt) {
      setSelectedAppointment(existingAppt);
      setIsCancelModalOpen(true);
      return; 
    }

    setSelectedSlot({
      machineId,
      slotLabel,
      date: selectedDate,
      unitNum
    });
    setIsModalOpen(true);
  };

  const handleCancelSession = async () => {
    if (!selectedAppointment) return;
    
    if (window.confirm(`Are you sure you want to cancel the session for ${selectedAppointment.patient_name}? This will set the slot to Available.`)) {
      try {
        await appointmentService.delete(selectedAppointment.id);
        setIsCancelModalOpen(false);
        fetchData(); // Refresh the grid
      } catch (error) {
        console.error('Error canceling session:', error);
        alert('Failed to cancel session. Please try again.');
      }
    }
  };

  const formatDateLabel = (dateStr) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString(undefined, options);
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const getWeekDays = () => {
    const start = new Date(selectedDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(start.setDate(diff));
    
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  };

  const getDayAppointments = (machineId, date, slotLabel) => {
    return appointments.find(a => 
      a.machine === machineId && 
      a.time_slot === slotLabel && 
      a.date === date
    );
  };

  return (
    <div className="scheduling-container">
      <header className="scheduling-header">
        <div className="header-left">
          <h1>Sessions</h1>
          <div className="date-picker-nav">
            <button className="nav-icon-btn" onClick={() => changeDate(-1)}><ArrowLeft size={18} /></button>
            <div className="current-date">
              <label htmlFor="scheduling-date-picker" className="date-picker-trigger">
                <Calendar size={18} color="#0ea5e9" />
                <span>{formatDateLabel(selectedDate)}</span>
              </label>
              <input 
                id="scheduling-date-picker"
                type="date" 
                className="hidden-date-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            <button className="nav-icon-btn" onClick={() => changeDate(1)}><ArrowRight size={18} /></button>
          </div>
        </div>
        <div className="header-right">
          <button className="add-appointment-btn" onClick={() => setIsModalOpen(true)}>
            <span>Book New Session</span>
          </button>
        </div>
      </header>

      <div className={`scheduling-grid-wrapper no-border shadow-soft ${viewMode}`}>
        {viewMode === 'daily' ? (
          <>
            <div className="grid-header-row daily-standard">
              <div className="machine-col-header">Machine Unit</div>
              {timeSlots.map((slot, idx) => (
                <div key={idx} className="slot-col-header">
                  <Clock size={16} />
                  <span>{slot}</span>
                </div>
              ))}
            </div>

            <div className="grid-body daily-standard">
              {loading ? (
                <div className="p-10 text-center">Loading machine allocation...</div>
              ) : (
                Array.from({ length: 10 }, (_, i) => i + 1).map(unitNum => {
                  const machine = machines.find(m => parseInt(m.unit_number) === unitNum);
                  
                  return (
                    <div key={unitNum} className={`grid-row daily-standard ${machine?.type?.toLowerCase() || 'standard'}`}>
                      <div className="machine-info-cell">
                        <div className="unit-number-circle">{unitNum}</div>
                        <div className="m-text">
                          <span className="m-name">Unit {unitNum}</span>
                          {machine && <span className="m-type">{machine.type}</span>}
                        </div>
                      </div>
                      
                      {timeSlots.map((slotLabel, slotIdx) => {
                        const appt = machine ? getAppointment(machine.id, slotLabel) : null;
                        const isOutOfService = machine?.status === 'Maintenance' || machine?.status === 'Out of Service';
                        
                        return (
                          <div key={slotIdx} className="slot-cell">
                            {machine ? (
                              isOutOfService ? (
                                <button 
                                  className={`status-pill ${machine.status === 'Maintenance' ? 'maintenance' : 'out-of-service'}`}
                                  onClick={() => handleSlotClick(machine.id, slotLabel, unitNum)}
                                >
                                  <span>{machine.status}</span>
                                </button>
                              ) : appt ? (
                                (() => {
                                  const liveStatus = getLiveStatus(appt);
                                  return (
                                    <button 
                                      className={`status-pill occupied ${liveStatus?.toLowerCase()}`}
                                      title={`${appt.patient_name} (${liveStatus})`}
                                      onClick={() => handleSlotClick(machine.id, slotLabel, unitNum)}
                                    >
                                      {liveStatus === 'Completed' ? (
                                        <div className="status-content">
                                          <CheckCircle2 size={14} />
                                          <span>Finished</span>
                                        </div>
                                      ) : liveStatus === 'In-Progress' ? (
                                        <div className="status-content">
                                          <PlayCircle size={14} className="pulse-icon" />
                                          <span>In Session</span>
                                        </div>
                                      ) : (
                                        <span>Occupied</span>
                                      )}
                                    </button>
                                  );
                                })()
                              ) : (
                                <button 
                                  className="status-pill available"
                                  onClick={() => handleSlotClick(machine.id, slotLabel, unitNum)}
                                >
                                  <span>Available</span>
                                </button>
                              )
                            ) : (
                              // Mixed up placeholders for demonstration
                              unitNum % 4 === 0 ? (
                                <button 
                                  className="status-pill out-of-service"
                                  onClick={() => handleSlotClick(null, slotLabel, unitNum)}
                                >
                                  <span>Out of Service</span>
                                </button>
                              ) : unitNum % 4 === 1 ? (
                                <button 
                                  className="status-pill available placeholder" 
                                  onClick={() => handleSlotClick(null, slotLabel, unitNum)}
                                >
                                  <span>Available</span>
                                </button>
                              ) : (
                                <button 
                                  className="status-pill unavailable"
                                  onClick={() => handleSlotClick(null, slotLabel, unitNum)}
                                >
                                  <span>Occupied</span>
                                </button>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <>
            <div className="grid-header-row weekly">
              <div className="machine-col-header">Machine Unit</div>
              {getWeekDays().map((date, idx) => {
                const d = new Date(date);
                return (
                  <div key={idx} className="slot-col-header weekly">
                    <span className="w-day">{d.toLocaleDateString(undefined, { weekday: 'short' })}</span>
                    <span className="w-date">{d.getDate()}</span>
                  </div>
                );
              })}
            </div>

            <div className="grid-body">
              {loading ? (
                <div className="p-10 text-center">Loading machine allocation...</div>
              ) : (
                machines.map((machine) => (
                  <div key={machine.id} className="grid-row weekly">
                    <div className={`machine-info-cell ${machine.type?.toLowerCase() || ''}`}>
                      <Monitor size={18} color={machine.type === 'HIV' ? '#ef4444' : '#3b82f6'} />
                      <div className="m-text">
                        <span className="m-name">U {machine.unit_number}</span>
                      </div>
                    </div>
                    {getWeekDays().map((date, dateIdx) => (
                      <div key={dateIdx} className="slot-cell weekly">
                        <div className="session-indicators">
                          {timeSlots.map((slot, sIdx) => {
                            const appt = getDayAppointments(machine.id, date, slot);
                            return (
                              <div 
                                key={sIdx} 
                                className={`s-dot ${appt ? 'booked' : 'free'}`}
                                title={`${slot}: ${appt ? 'Booked' : 'Available'}`}
                                onClick={() => !appt && handleSlotClick(machine.id, slot, date)}
                              >
                                {sIdx + 1}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <BookingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        slotData={selectedSlot}
        onRefresh={fetchData}
        machines={machines}
        appointments={appointments}
      />

      <SessionReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        appointment={selectedAppointment}
        onRefresh={fetchData}
      />

      {/* Manage/Cancel Session Modal */}
      {isCancelModalOpen && selectedAppointment && (
        <div className="status-alert-overlay" onClick={() => setIsCancelModalOpen(false)}>
          <div className="status-alert-modal" onClick={e => e.stopPropagation()}>
            <div className={`status-alert-icon ${selectedAppointment.status === 'Completed' ? 'teal' : 'blue'}`}>
              {selectedAppointment.status === 'Completed' ? <CheckCircle2 size={32} /> : <User size={32} />}
            </div>
            <h3>{selectedAppointment.status === 'Completed' ? 'Session Finished' : 'Manage Session'}</h3>
            <p>
              Patient: <strong>{selectedAppointment.patient_name}</strong><br/>
              Status: <span className="status-text">{selectedAppointment.status}</span>
            </p>
            <p>
              {selectedAppointment.status === 'Completed' 
                ? "This treatment is complete. Would you like to clear this slot and make it Available again?"
                : "Would you like to cancel this appointment and reset it to Available?"}
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
              <button 
                className="status-alert-btn" 
                style={{ background: selectedAppointment.status === 'Completed' ? '#0ea5e9' : '#fef2f2', 
                        color: selectedAppointment.status === 'Completed' ? 'white' : '#ef4444' }}
                onClick={handleCancelSession}
              >
                {selectedAppointment.status === 'Completed' ? 'Clear Slot' : 'Cancel Session'}
              </button>
              <button 
                className="status-alert-btn" 
                style={{ background: '#f1f5f9', color: '#64748b' }}
                onClick={() => setIsCancelModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Machine Status Modal */}
      {statusModal && (
        <div className="status-alert-overlay" onClick={() => setStatusModal(null)}>
          <div className="status-alert-modal" onClick={e => e.stopPropagation()}>
            <div className={`status-alert-icon ${statusModal.type === 'Maintenance' ? 'orange' : 'red'}`}>
              <AlertCircle size={32} />
            </div>
            <h3>Unit {statusModal.unitNum} {statusModal.type}</h3>
            <p>
              {statusModal.type === 'Maintenance' 
                ? "This machine is currently undergoing scheduled maintenance. Booking is temporarily disabled."
                : "This machine is currently out of service and requires inspection. Please use another active unit."}
            </p>
            <button className="status-alert-btn" onClick={() => setStatusModal(null)}>Got it</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scheduling;
