import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Calendar, Clock, Monitor, User, ArrowRight, ArrowLeft, CheckCircle2, PlayCircle, AlertCircle, Edit3 } from 'lucide-react';
import { machineService, appointmentService } from '../../services/api';
import BookingModal from './BookingModal';
import SessionReportModal from './SessionReportModal';
import './Scheduling.css';

const Scheduling = () => {
  const location = useLocation();
  const [machines, setMachines] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [statusModal, setStatusModal] = useState(null); // { type, unitNum }
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [viewMode, setViewMode] = useState('daily'); // 'daily' or 'weekly'
  // eslint-disable-next-line no-unused-vars
  const [, setNowTick] = useState(0); // forces re-render every minute so slots transition

  const timeSlots = [
    '07:30 AM - 11:30 AM',
    '12:00 PM - 04:00 PM'
  ];

  // Parse "YYYY-MM-DD" as a LOCAL date so display matches state across timezones.
  const parseLocalDate = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const toLocalDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayStr = toLocalDateStr(new Date());

  const getSlotEndTime = (slotLabel, dateStr) => {
    const [startStr] = slotLabel.split(' - ');
    const [hours, minutes] = startStr.split(':');
    const isPM = startStr.includes('PM');

    const startTime = parseLocalDate(dateStr);
    let h = parseInt(hours);
    if (isPM && h !== 12) h += 12;
    if (!isPM && h === 12) h = 0;
    startTime.setHours(h, parseInt(minutes), 0);

    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 4); // each slot is 4 hours
    return { startTime, endTime };
  };

  const isSlotPast = (slotLabel, dateStr) => {
    if (dateStr < todayStr) return true;
    if (dateStr > todayStr) return false;
    const now = new Date();
    const { endTime } = getSlotEndTime(slotLabel, dateStr);
    return now > endTime;
  };

  const getLiveStatus = (appt) => {
    if (!appt) return null;
    if (appt.status === 'Completed') return 'Completed';

    const now = new Date();
    const { startTime, endTime } = getSlotEndTime(appt.time_slot, selectedDate);

    if (now >= startTime && now <= endTime) return 'In-Progress';
    if (now > endTime) return 'Completed';
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

  // Tick every 60 seconds so the slot grid transitions as time passes
  useEffect(() => {
    const id = setInterval(() => setNowTick((t) => t + 1), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  // Handle auto-edit from Dashboard Resolve button
  useEffect(() => {
    if (!loading && appointments.length > 0) {
      const params = new URLSearchParams(location.search);
      const editId = params.get('edit');
      if (editId) {
        const apptToEdit = appointments.find(a => a.id === parseInt(editId));
        if (apptToEdit) {
          // If it's a different date, switch to that date first
          if (apptToEdit.date !== selectedDate) {
            setSelectedDate(apptToEdit.date);
          }
          // Open modal in edit mode
          const machine = machines.find(m => m.id === apptToEdit.machine);
          setSelectedAppointment(apptToEdit);
          setSelectedSlot({
            machineId: apptToEdit.machine,
            slotLabel: apptToEdit.time_slot,
            date: apptToEdit.date,
            unitNum: machine?.unit_number || '?',
            editMode: true,
            appointment: apptToEdit
          });
          setIsModalOpen(true);
        }
      }

      // Handle auto-report from Dashboard
      const reportId = params.get('report');
      if (reportId) {
        const apptToReport = appointments.find(a => a.id === parseInt(reportId));
        if (apptToReport) {
          if (apptToReport.date !== selectedDate) {
            setSelectedDate(apptToReport.date);
          }
          setSelectedAppointment(apptToReport);
          setIsReportModalOpen(true);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, appointments, location.search]);

  const getAppointment = (machineId, slotLabel) => {
    return appointments.find(a => 
      a.machine === machineId && 
      a.time_slot === slotLabel && 
      a.date === selectedDate
    );
  };

  const handleEditSession = () => {
    if (!selectedAppointment) return;
    const machine = machines.find(m => m.id === selectedAppointment.machine);
    setSelectedSlot({
      machineId: selectedAppointment.machine,
      slotLabel: selectedAppointment.time_slot,
      date: selectedAppointment.date,
      unitNum: machine?.unit_number || '?',
      editMode: true,
      appointment: selectedAppointment
    });
    setIsCancelModalOpen(false);
    setIsModalOpen(true);
  };

  const handleSlotClick = (machineId, slotLabel, unitNum) => {
    const existingAppt = getAppointment(machineId, slotLabel);
    const machine = machines.find(m => m.id === machineId);

    if (machine?.status === 'Maintenance' || machine?.status === 'Out of Service') {
      setStatusModal({ type: machine.status, unitNum });
      return;
    }

    if (existingAppt) {
      setSelectedAppointment(existingAppt);
      setIsCancelModalOpen(true);
      return;
    }

    // Block booking past slots
    if (isSlotPast(slotLabel, selectedDate)) {
      setStatusModal({ type: 'Unavailable', unitNum });
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
    try {
      await appointmentService.delete(selectedAppointment.id);
      setIsCancelModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error canceling session:', error);
    }
  };
  const formatDateLabel = (dateStr) => {
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return parseLocalDate(dateStr).toLocaleDateString(undefined, options);
  };

  const changeDate = (days) => {
    const newDate = parseLocalDate(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(toLocalDateStr(newDate));
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
              ) : machines.length === 0 ? (
                <div className="empty-state-container">
                  <div className="empty-state-card">
                    <Monitor size={48} className="empty-state-icon" />
                    <h4>No Machine Units Configured</h4>
                    <p>There are no dialysis machines registered in the system. Add machine units to set up schedules.</p>
                  </div>
                </div>
              ) : (
                machines.map((machine, index) => {
                const unitNum = machine.unit_number;
                return (
                  <div key={machine.id} className={`grid-row daily-standard ${machine.type?.toLowerCase() || 'standard'}`}>
                    <div className="machine-info-cell">
                      <div className="unit-number-circle">{index + 1}</div>
                      <div className="m-text">
                        <span className="m-name">{unitNum}</span>
                        <span className="m-type">{machine.type}</span>
                      </div>
                    </div>
                    
                    {timeSlots.map((slotLabel, slotIdx) => {
                      const appt = getAppointment(machine.id, slotLabel);
                      const isOutOfService = machine.status === 'Maintenance' || machine.status === 'Out of Service';
                      const slotPast = isSlotPast(slotLabel, selectedDate);

                      return (
                        <div key={slotIdx} className="slot-cell">
                          {isOutOfService ? (
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
                                    <div className="status-content-stack">
                                      {liveStatus === 'Completed' ? (
                                        <div className="status-main">
                                          <CheckCircle2 size={12} />
                                          <span>Finished</span>
                                        </div>
                                      ) : liveStatus === 'In-Progress' ? (
                                        <div className="status-main">
                                          <PlayCircle size={12} className="pulse-icon" />
                                          <span>In Session</span>
                                        </div>
                                      ) : (
                                        <div className="status-main">Occupied</div>
                                      )}
                                      <div className="appt-patient-details">
                                        <div className="appt-p-name">{appt.patient_name?.split(' ')[0]}</div>
                                        <div className="appt-p-id">ID: {appt.patient_uid}</div>
                                      </div>
                                    </div>
                                  </button>
                              );
                            })()
                          ) : slotPast ? (
                            <button
                              className="status-pill unavailable"
                              onClick={() => handleSlotClick(machine.id, slotLabel, unitNum)}
                              title="This time slot has already passed"
                            >
                              <span>Unavailable</span>
                            </button>
                          ) : (
                            <button
                              className="status-pill available"
                              onClick={() => handleSlotClick(machine.id, slotLabel, unitNum)}
                            >
                              <span>Available</span>
                            </button>
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
              ) : machines.length === 0 ? (
                <div className="empty-state-container">
                  <div className="empty-state-card">
                    <Monitor size={48} className="empty-state-icon" />
                    <h4>No Machine Units Configured</h4>
                    <p>There are no dialysis machines registered in the system. Add machine units to set up schedules.</p>
                  </div>
                </div>
              ) : (
                machines.map((machine) => (
                  <div key={machine.id} className="grid-row weekly">
                    <div className={`machine-info-cell ${machine.type?.toLowerCase() || ''}`}>
                      <Monitor size={18} color={
                        machine.type === 'HIV' ? '#ef4444' : 
                        machine.type === 'HCV' ? '#a855f7' : 
                        machine.type === 'HIV_HCV' ? '#701a75' : 
                        '#3b82f6'
                      } />
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '1.5rem' }}>
              {selectedAppointment.status !== 'Completed' && (
                <button 
                  className="status-alert-btn" 
                  style={{ background: '#0ea5e9', color: 'white', flex: 1 }}
                  onClick={handleEditSession}
                >
                  <Edit3 size={16} />
                  <span>Edit Allocation</span>
                </button>
              )}
              <button 
                className="status-alert-btn" 
                style={{ background: selectedAppointment.status === 'Completed' ? '#0ea5e9' : '#fef2f2', 
                        color: selectedAppointment.status === 'Completed' ? 'white' : '#ef4444',
                        flex: 1 }}
                onClick={handleCancelSession}
              >
                {selectedAppointment.status === 'Completed' ? 'Clear Slot' : 'Cancel Session'}
              </button>
              <button 
                className="status-alert-btn" 
                style={{ background: '#f1f5f9', color: '#64748b', width: '100%' }}
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
            <div className={`status-alert-icon ${
              statusModal.type === 'Maintenance' || statusModal.type === 'Unavailable' ? 'orange' : 'red'
            }`}>
              <AlertCircle size={32} />
            </div>
            <h3>
              {statusModal.type === 'Unavailable'
                ? 'Time Slot Closed'
                : `Unit ${statusModal.unitNum} ${statusModal.type}`}
            </h3>
            <p>
              {statusModal.type === 'Maintenance'
                ? 'This machine is currently undergoing scheduled maintenance. Booking is temporarily disabled.'
                : statusModal.type === 'Unavailable'
                ? 'This time slot has already passed for the selected date. Bookings can only be made for upcoming time slots.'
                : 'This machine is currently out of service and requires inspection. Please use another active unit.'}
            </p>
            <button className="status-alert-btn" onClick={() => setStatusModal(null)}>Got it</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Scheduling;
