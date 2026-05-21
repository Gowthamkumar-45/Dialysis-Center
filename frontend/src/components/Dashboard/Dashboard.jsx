import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  ChevronRight,
  UserPlus,
  Calendar,
  ClipboardList,
  FileText,
  Package,
  Activity,
  Users,
  TrendingUp,
  Clock,
  ShieldAlert,
  CheckCircle2,
  UserCheck,
  UserMinus,
  PackageX,
  CalendarOff,
  Wrench,
  Heart,
  UserX
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {  patientService, staffService, appointmentService, 
  treatmentSessionService, machineService, attendanceService,
  inventoryService
} from '../../services/api';
import SessionReportModal from '../Scheduling/SessionReportModal';
import './Dashboard.css';

const Dashboard = () => {
  const [machines, setMachines] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [treatmentSessions, setTreatmentSessions] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const [machinesRes, apptsRes, patientsRes, staffRes, sessionsRes, attendanceRes, inventoryRes] = await Promise.all([
        machineService.getAll(),
        appointmentService.getAll(),
        patientService.getAll(),
        staffService.getAll(),
        treatmentSessionService.getAll(),
        attendanceService.getRoster(new Date().toISOString().split('T')[0]),
        inventoryService.getAll()
      ]);
      setMachines(machinesRes.data);
      setAppointments(apptsRes.data);
      setPatients(patientsRes.data);
      setStaff(staffRes.data);
      setTreatmentSessions(sessionsRes.data);
      setAttendance(attendanceRes.data.roster || []);
      setInventory(inventoryRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResolve = async (alertItem) => {
    console.log("Resolving alert:", alertItem);
    const id = alertItem.id;

    // Machine misuse (incl. HIV / HCV / HIV_HCV dual / standard)
    if (id.startsWith('hiv-') || id.startsWith('hcv-') || id.startsWith('dual-') || id.startsWith('misuse-')) {
      navigate(alertItem.appointmentId ? `/sessions?edit=${alertItem.appointmentId}` : '/sessions');
      return;
    }

    // Double-booking
    if (id.startsWith('db-')) {
      navigate('/sessions');
      return;
    }

    // Pending treatment-form documentation
    if (id.startsWith('doc-') || id.startsWith('missing-doc-')) {
      if (alertItem.appointmentId) {
        const appt = appointments.find(a => a.id === alertItem.appointmentId);
        if (appt) {
          setSelectedAppointment(appt);
          setIsReportModalOpen(true);
        } else {
          navigate(`/sessions?report=${alertItem.appointmentId}`);
        }
      } else {
        navigate('/sessions');
      }
      return;
    }

    // Inventory issues (out / low / expiring / expired)
    if (id.startsWith('stock-') || id.startsWith('exp-') || id.startsWith('exp-soon-')) {
      navigate('/inventory');
      return;
    }

    // Machine AMC expiry
    if (id.startsWith('amc-') || id.startsWith('amc-soon-')) {
      navigate(alertItem.machineId ? `/machines/${alertItem.machineId}` : '/machines');
      return;
    }

    // Critical session outcome
    if (id.startsWith('critical-')) {
      if (alertItem.patientId) navigate(`/patients/${alertItem.patientId}`);
      else navigate('/sessions');
      return;
    }

    // Unmarked staff attendance
    if (id === 'att-unmarked') {
      navigate('/attendance');
      return;
    }
  };

  const getCurrentTimeSlot = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const totalMinutes = hour * 60 + minute;

    // 07:30 AM (450 mins) - 11:30 AM (690 mins)
    if (totalMinutes >= 450 && totalMinutes <= 690) return '07:30 AM - 11:30 AM';
    
    // 12:00 PM (720 mins) - 04:00 PM (960 mins)
    if (totalMinutes >= 720 && totalMinutes <= 960) return '12:00 PM - 04:00 PM';
    
    return null;
  };

  const getLiveStatus = (timeSlot, currentStatus) => {
    if (currentStatus === 'Completed') return 'Completed';
    
    const [startStr] = timeSlot.split(' - ');
    const now = new Date();
    const [hours, minutes] = startStr.split(':');
    const isPM = startStr.includes('PM');
    
    const startTime = new Date();
    let h = parseInt(hours);
    if (isPM && h !== 12) h += 12;
    if (!isPM && h === 12) h = 0;
    startTime.setHours(h, parseInt(minutes), 0);

    const endTime = new Date(startTime);
    endTime.setHours(startTime.getHours() + 4);

    if (now >= startTime && now <= endTime) return 'In-Progress';
    if (now > endTime) return 'Completed';
    return 'Upcoming';
  };

  const getMachineStatus = (machineId) => {
    const today = new Date().toISOString().split('T')[0];
    const currentTimeSlot = getCurrentTimeSlot();
    
    if (!currentTimeSlot) return 'Available';

    const currentAppt = appointments.find(a => 
      a.machine === machineId && 
      a.date === today && 
      a.time_slot === currentTimeSlot &&
      a.status !== 'Completed'
    );

    return currentAppt ? 'In Use' : 'Available';
  };

  const getStatusIcon = (status, currentStatus) => {
    if (status === 'Maintenance') return <ShieldAlert size={14} />;
    if (status === 'Out of Service') return <AlertCircle size={14} />;
    if (currentStatus === 'In Use') return <Activity size={14} className="pulse-icon" />;
    return <CheckCircle2 size={14} />;
  };

  const generateDynamicAlerts = () => {
    const activeAlerts = [];
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Detect Double-booking
    const bookingsBySlot = {};
    appointments.forEach(appt => {
      if (appt.date === todayStr && appt.status !== 'Cancelled') {
        const key = `${appt.date}-${appt.time_slot}-${appt.machine}`;
        if (!bookingsBySlot[key]) bookingsBySlot[key] = [];
        bookingsBySlot[key].push(appt);
      }
    });

    Object.keys(bookingsBySlot).forEach(key => {
      if (bookingsBySlot[key].length > 1) {
        const machineId = bookingsBySlot[key][0].machine;
        const machineObj = machines.find(m => m.id === machineId);
        const slot = bookingsBySlot[key][0].time_slot;
        activeAlerts.push({
          id: `db-${key}`,
          type: 'error',
          icon: <AlertCircle size={18} />,
          title: 'Double-booking detected',
          msg: `Machine #${machineObj?.unit_number || machineId} scheduled for ${bookingsBySlot[key].length} patients at ${slot} today`
        });
      }
    });

    // 2. Detect Machine Misuse (HIV / HCV / Standard / HIV_HCV)
    appointments.forEach(appt => {
      if (appt.date === todayStr && appt.status !== 'Cancelled') {
        const machineObj = machines.find(m => m.id === appt.machine);
        const patientObj = patients.find(p => p.id === appt.patient);

        if (!machineObj || !patientObj) return;

        const isPatientHiv = !!patientObj.hiv_status;
        const isPatientHcv = !!patientObj.hepatitis_c;

        if (machineObj.type === 'HIV' && !isPatientHiv) {
          activeAlerts.push({
            id: `hiv-${appt.id}`,
            type: 'error',
            icon: <ShieldAlert size={18} />,
            title: 'HIV machine misuse',
            msg: `Non-HIV patient ${patientObj.full_name} is using HIV-dedicated machine #${machineObj.unit_number}`,
            patientId: patientObj.id,
            appointmentId: appt.id
          });
        } else if (machineObj.type === 'HCV' && !isPatientHcv) {
          activeAlerts.push({
            id: `hcv-${appt.id}`,
            type: 'error',
            icon: <ShieldAlert size={18} />,
            title: 'HCV machine misuse',
            msg: `Non-HCV patient ${patientObj.full_name} is using HCV-dedicated machine #${machineObj.unit_number}`,
            patientId: patientObj.id,
            appointmentId: appt.id
          });
        } else if (machineObj.type === 'HIV_HCV' && !(isPatientHiv || isPatientHcv)) {
          activeAlerts.push({
            id: `dual-${appt.id}`,
            type: 'error',
            icon: <ShieldAlert size={18} />,
            title: 'HIV/HCV machine misuse',
            msg: `Standard patient ${patientObj.full_name} is using a HIV/HCV-dedicated machine #${machineObj.unit_number}`,
            patientId: patientObj.id,
            appointmentId: appt.id
          });
        } else if (machineObj.type === 'Standard' && (isPatientHiv || isPatientHcv)) {
          activeAlerts.push({
            id: `misuse-${appt.id}`,
            type: 'error',
            icon: <ShieldAlert size={18} />,
            title: 'Standard machine misuse',
            msg: `Infected patient ${patientObj.full_name} (${isPatientHiv ? 'HIV' : 'HCV'}) is using Standard machine #${machineObj.unit_number}`,
            patientId: patientObj.id,
            appointmentId: appt.id
          });
        }
      }
    });

    // 4. Detect Logically Completed but Unfilled Treatment Forms.
    // TreatmentSession has no FK to Appointment, so match by patient + date.
    appointments.forEach(appt => {
      if (appt.date === todayStr && appt.status !== 'Cancelled' && appt.status !== 'Completed') {
        const liveStatus = getLiveStatus(appt.time_slot, appt.status);
        if (liveStatus === 'Completed') {
          const hasForm = treatmentSessions.some(s =>
            s.patient === appt.patient && s.date === appt.date
          );
          if (!hasForm) {
            const patientObj = patients.find(p => p.id === appt.patient);
            activeAlerts.push({
              id: `missing-doc-${appt.id}`,
              type: 'warning',
              icon: <ClipboardList size={18} />,
              title: 'Treatment form pending',
              msg: `Session for ${patientObj?.full_name || 'Patient'} finished but post-treatment data not recorded.`,
              patientId: appt.patient,
              appointmentId: appt.id
            });
          }
        }
      }
    });

    // 5. Inventory — out of stock (critical)
    inventory.forEach(item => {
      if (item.stock <= 0) {
        activeAlerts.push({
          id: `stock-out-${item.id}`,
          type: 'error',
          icon: <PackageX size={18} />,
          title: 'Out of stock',
          msg: `${item.name} (${item.item_code}) is out of stock — re-order required immediately.`,
        });
      } else if (item.threshold && item.stock < item.threshold) {
        activeAlerts.push({
          id: `stock-low-${item.id}`,
          type: 'warning',
          icon: <Package size={18} />,
          title: 'Low stock',
          msg: `${item.name} is running low (${item.stock} ${item.unit || 'pcs'} left, threshold ${item.threshold}).`,
        });
      }
    });

    // 6. Inventory — expired or expiring within 30 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const in30Days = new Date(today);
    in30Days.setDate(today.getDate() + 30);

    inventory.forEach(item => {
      if (!item.expiry) return;
      const expiry = new Date(item.expiry);
      if (isNaN(expiry.getTime())) return;
      if (expiry < today) {
        activeAlerts.push({
          id: `exp-${item.id}`,
          type: 'error',
          icon: <CalendarOff size={18} />,
          title: 'Inventory expired',
          msg: `${item.name} expired on ${item.expiry} — remove from circulation.`,
        });
      } else if (expiry <= in30Days) {
        const days = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        activeAlerts.push({
          id: `exp-soon-${item.id}`,
          type: 'warning',
          icon: <CalendarOff size={18} />,
          title: 'Inventory expiring soon',
          msg: `${item.name} expires in ${days} day${days === 1 ? '' : 's'} (${item.expiry}).`,
        });
      }
    });

    // 7. Machine — AMC expiring within 30 days or expired
    machines.forEach(machine => {
      if (!machine.amc_upto) return;
      const amc = new Date(machine.amc_upto);
      if (isNaN(amc.getTime())) return;
      if (amc < today) {
        activeAlerts.push({
          id: `amc-${machine.id}`,
          type: 'warning',
          icon: <Wrench size={18} />,
          title: 'AMC expired',
          msg: `Unit #${machine.unit_number} AMC expired on ${machine.amc_upto}.`,
          machineId: machine.id,
        });
      } else if (amc <= in30Days) {
        const days = Math.ceil((amc - today) / (1000 * 60 * 60 * 24));
        activeAlerts.push({
          id: `amc-soon-${machine.id}`,
          type: 'info',
          icon: <Wrench size={18} />,
          title: 'AMC renewal due',
          msg: `Unit #${machine.unit_number} AMC expires in ${days} day${days === 1 ? '' : 's'}.`,
          machineId: machine.id,
        });
      }
    });

    // 8. Critical session outcomes recorded today
    const criticalOutcomes = ['Critical', 'Bleeding', 'BP Dip Observed'];
    treatmentSessions.forEach(s => {
      if (s.date === todayStr && criticalOutcomes.includes(s.outcome)) {
        const patientObj = patients.find(p => p.id === s.patient);
        activeAlerts.push({
          id: `critical-${s.id}`,
          type: 'error',
          icon: <Heart size={18} />,
          title: 'Critical session outcome',
          msg: `${patientObj?.full_name || 'Patient'} — ${s.outcome} during session today. Clinical review needed.`,
          patientId: s.patient,
        });
      }
    });

    // 9. Staff attendance unmarked after 11 AM
    const now = new Date();
    if (now.getHours() >= 11 && attendance.length > 0) {
      const unmarked = attendance.filter(a => a.status === 'Unmarked');
      if (unmarked.length > 0) {
        activeAlerts.push({
          id: 'att-unmarked',
          type: 'info',
          icon: <UserX size={18} />,
          title: 'Attendance unmarked',
          msg: `${unmarked.length} staff member${unmarked.length === 1 ? "'s" : "s'"} attendance not yet recorded for today.`,
        });
      }
    }

    return activeAlerts;
  };

  const activeAlerts = generateDynamicAlerts();

  // Calculate Dynamic Stats
  const today = new Date().toISOString().split('T')[0];
  const todayAppts = Array.isArray(appointments) ? appointments.filter(a => a.date === today) : [];
  
  const totalSessions = todayAppts.length;
  const completedSessions = todayAppts.filter(a => a.status === 'Completed').length;
  const pendingSessions = totalSessions - completedSessions;
  
  // Real active machines (current session)
  const monitoringMachines = Array.isArray(machines) 
    ? machines
        .sort((a, b) => a.unit_number - b.unit_number)
        .map(m => ({
          ...m,
          currentStatus: getMachineStatus(m.id)
        }))
    : [];

  const activeMachinesCount = monitoringMachines.filter(m => m.currentStatus === 'In Use').length;
  const totalMachinesCount = Array.isArray(machines) ? machines.length : 0;
  
  const uniquePatientsCount = new Set(todayAppts.map(a => a.patient)).size;
  
  const utilizationPercent = totalMachinesCount > 0 ? Math.round((activeMachinesCount / totalMachinesCount) * 100) : 0;

  const totalStaffCount = attendance.length;
  const presentStaffCount = attendance.filter(a => ['Present', 'Late', 'Half-Day'].includes(a.status)).length;
  const onLeaveStaffCount = attendance.filter(a => a.status === 'On Leave').length;

  const stats = [
    { 
      id: 1, 
      icon: <Calendar />, 
      label: 'Sessions Scheduled', 
      value: totalSessions.toString(), 
      sub: `${completedSessions} completed • ${pendingSessions} pending`,
      tone: 'blue'
    },
    { 
      id: 2, 
      icon: <Activity />, 
      label: 'Machines Active', 
      value: `${activeMachinesCount}/${totalMachinesCount}`, 
      sub: `${monitoringMachines.filter(m => m.type === 'Standard' && m.currentStatus === 'In Use').length} standard • ${monitoringMachines.filter(m => m.type === 'HIV' && m.currentStatus === 'In Use').length} HIV`,
      tone: 'cyan'
    },
    { 
      id: 3, 
      icon: <TrendingUp />, 
      label: 'Utilization Rate', 
      value: `${utilizationPercent}%`, 
      sub: `Based on ${activeMachinesCount} active sessions`,
      tone: 'indigo'
    },
    { 
      id: 4, 
      icon: <Users />, 
      label: 'Total Staffs', 
      value: totalStaffCount.toString(), 
      sub: 'Registered employees',
      tone: 'slate'
    },
    { 
      id: 5, 
      icon: <UserCheck />, 
      label: 'Staff Present', 
      value: presentStaffCount.toString(), 
      sub: 'Currently on duty',
      tone: 'green'
    },
    { 
      id: 6, 
      icon: <UserMinus />, 
      label: 'Staffs Leave', 
      value: onLeaveStaffCount.toString(), 
      sub: 'Approved absences',
      tone: 'amber'
    },
    { 
      id: 7, 
      icon: <Users />, 
      label: 'Patients Scheduled', 
      value: uniquePatientsCount.toString(), 
      sub: 'Unique patients today',
      tone: 'violet'
    },
    { 
      id: 8, 
      icon: <Package />, 
      label: 'Inventory Items', 
      value: inventory.length.toString(), 
      sub: 'Total stock items',
      tone: 'indigo'
    }
  ];

  const staffArray = Array.isArray(staff) ? staff : [];
  const patientsArray = Array.isArray(patients) ? patients : [];

  const staffOnDuty = staffArray.filter(s => s.is_on_duty).length;
  const maintenanceMachines = Array.isArray(machines) ? machines.filter(m => m.status === 'Maintenance' || m.status === 'Out of Service').length : 0;
  const activePatients = patientsArray.filter(p => p.status === 'Active').length;
  const inactivePatients = patientsArray.filter(p => p.status !== 'Active').length;

  const secondaryStats = [
    { id: 5, icon: <UserPlus />, label: 'Staff on Duty',     value: staffOnDuty.toString(),                sub: `of ${staffArray.length} total staff` },
    { id: 6, icon: <Package />,  label: 'Machines Online',   value: `${(Array.isArray(machines) ? machines.length : 0) - maintenanceMachines}`, sub: `${maintenanceMachines} under maintenance` },
    { id: 7, icon: <Users />,    label: 'Active Patients',   value: activePatients.toString(),             sub: `${inactivePatients} inactive` },
    { id: 8, icon: <CheckCircle2 />, label: 'Completed Today', value: completedSessions.toString(),        sub: `of ${totalSessions} scheduled` },
  ];

  const quickActions = [
    { icon: <UserPlus />,      label: 'Add New Patient',  desc: 'Register new profile',   route: '/patients', tone: 'blue' },
    { icon: <Calendar />,      label: 'Book Session',     desc: 'Schedule machine slot',   route: '/sessions', tone: 'green' },
    { icon: <ClipboardList />, label: 'Log Treatment',    desc: 'Record session data',     route: '/sessions', tone: 'amber' },
    { icon: <FileText />,      label: 'View Reports',     desc: 'Clinical session history', route: '/history?entity=Session', tone: 'violet' },
  ];

  const todaySchedule = todayAppts
    .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
    .slice(0, 4);

  return (
    <div className="dashboard-container">
      {/* Top Section: Alerts (Only show if issues detected) */}
      {activeAlerts.length > 0 && (
        <section className="alerts-block card">
          <div className="block-header">
            <div className="header-label">
              <AlertCircle size={20} className="text-primary" />
              <h2>System Alerts</h2>
            </div>
            <button className="text-btn">View All</button>
          </div>
          <div className="alerts-stack">
            {activeAlerts.map(alert => (
              <div key={alert.id} className="alert-row">
                <div className="alert-main">
                  <div className={`alert-indicator ${alert.type}`}></div>
                  <div className="alert-info">
                    <span className="alert-title">{alert.title}</span>
                    <p className="alert-text">{alert.msg}</p>
                  </div>
                </div>
                <button className="action-pill" onClick={() => handleResolve(alert)}>Resolve</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Stats */}
      <div className="dash-stats-row">
        {stats.map(stat => (
          <div key={stat.id} className={`stat-box card tone-${stat.tone}`}>
            <div className="stat-top">
              <div className="stat-icon-bg">{stat.icon}</div>
              <span className="stat-val">{stat.value}</span>
            </div>
            <div className="stat-bottom">
              <span className="stat-name">{stat.label}</span>
              <span className="stat-detail">{stat.sub}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Left Column: Schedule */}
        <section className="schedule-block card">
          <div className="block-header">
            <div className="header-label">
              <Clock size={20} className="text-primary" />
              <h2>Today's Schedule</h2>
            </div>
            <button className="text-btn secondary">Full Calendar</button>
          </div>
          
          <div className="sched-list">
            {todaySchedule.length > 0 ? todaySchedule.map((item, idx) => (
              <div key={idx} className="sched-row-new">
                <div className="sched-time-box">
                  <span className="sched-time-main">{item.time_slot}</span>
                  <span className="sched-duration-label">4h session</span>
                </div>
                
                <div className="patient-profile-snippet">
                  <div className="avatar-mini">
                    {item.patient_name?.charAt(0) || 'P'}
                  </div>
                  <div className="patient-text-info">
                    <span className="p-name-label">{item.patient_name}</span>
                    <span className="p-unit-tag">
                      Unit • {item.is_hiv ? 'HIV' : 'Standard'}
                    </span>
                  </div>
                </div>

                <div className="sched-status-container">
                  {(() => {
                    const liveStatus = getLiveStatus(item.time_slot, item.status);
                    return (
                      <span className={`status-pill ${liveStatus.toLowerCase().replace(' ', '-')}`}>
                        {liveStatus === 'Completed' && <CheckCircle2 size={12} />}
                        {liveStatus}
                      </span>
                    );
                  })()}
                </div>
              </div>
            )) : (
              <div className="empty-state-dashboard">
                <Calendar size={32} />
                <p>No sessions scheduled for today</p>
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Quick Actions & Secondary Stats */}
        <div className="sidebar-column">
          <section className="actions-block card">
            <h2>Quick Actions</h2>
            <div className="actions-grid">
              {quickActions.map((action, idx) => (
                <button key={idx} className={`action-tile tone-${action.tone}`} onClick={() => navigate(action.route)}>
                  <div className="action-icon">{action.icon}</div>
                  <div className="action-label-box">
                    <span className="a-label">{action.label}</span>
                    <span className="a-desc">{action.desc}</span>
                  </div>
                  <ChevronRight size={14} className="chevron" />
                </button>
              ))}
            </div>
          </section>

          <div className="mini-stats-grid">
            {secondaryStats.slice(0, 2).map(stat => (
              <div key={stat.id} className="mini-stat-card card">
                <span className="m-label">{stat.label}</span>
                <span className="m-val">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Machine Overview */}
      <section className="machine-block card">
        <div className="block-header">
          <div className="header-label">
            <Activity size={20} className="text-primary" />
            <h2>Machine Monitoring</h2>
          </div>
        </div>
        <div className="machine-grid-simple">
          {monitoringMachines.map(m => {
            const isHiv = m.type === 'HIV';
            const isMaintenance = m.status === 'Maintenance';
            const isOOS = m.status === 'Out of Service';
            const displayStatus = (isMaintenance || isOOS) ? m.status : m.currentStatus;
            const statusIcon = getStatusIcon(m.status, m.currentStatus);
            
            return (
              <div key={m.id} className={`m-tile ${m.currentStatus === 'In Use' ? 'busy' : 'free'} ${isHiv ? 'hiv' : ''} ${isMaintenance ? 'maintenance' : ''} ${isOOS ? 'oos' : ''}`}>
                <div className="m-tile-header">
                  <span className="m-num">DM-{String(m.unit_number).padStart(2, '0')}</span>
                  <span className="m-type-label">{m.type}</span>
                </div>
                <div className="m-status-row">
                  <span className="m-icon">{statusIcon}</span>
                  <span className="m-stat">{displayStatus}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <SessionReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        appointment={selectedAppointment}
        onRefresh={fetchData}
      />
    </div>
  );
};

export default Dashboard;
