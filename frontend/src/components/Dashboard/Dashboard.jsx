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
  CreditCard,
  Clock,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { machineService, appointmentService, patientService } from '../../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [machines, setMachines] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    try {
      const [machinesRes, apptsRes, patientsRes] = await Promise.all([
        machineService.getAll(),
        appointmentService.getAll(),
        patientService.getAll()
      ]);
      setMachines(machinesRes.data);
      setAppointments(apptsRes.data);
      setPatients(patientsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleResolve = async (alertItem) => {
    console.log("Resolving alert:", alertItem);
    
    // Logic based on alert type
    if (alertItem.id.startsWith('doc-')) {
      // Missing documentation - Navigate to patient profile
      const patientId = alertItem.patientId;
      if (patientId) {
        navigate(`/patients/${patientId}`);
      }
    } else if (alertItem.id.startsWith('hiv-')) {
      // HIV misuse - Open scheduling or just refresh data for now
      window.alert('To resolve this, please reassign the patient to a standard machine in the Schedule.');
      fetchData();
    } else if (alertItem.id.startsWith('db-')) {
      // Double booking
      window.alert('To resolve this, please reschedule one of the conflicting appointments.');
      fetchData();
    }
  };

  const getCurrentTimeSlot = () => {
    const hour = new Date().getHours();
    if (hour >= 8 && hour < 10) return '08:00 AM';
    if (hour >= 10 && hour < 12) return '10:00 AM';
    if (hour >= 12 && hour < 14) return '12:00 PM';
    if (hour >= 14 && hour < 16) return '02:00 PM';
    if (hour >= 16 && hour < 18) return '04:00 PM';
    return null;
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

    // 2. Detect HIV Machine Misuse
    appointments.forEach(appt => {
      if (appt.date === todayStr && appt.status !== 'Cancelled') {
        const machineObj = machines.find(m => m.id === appt.machine);
        const patientObj = patients.find(p => p.id === appt.patient);
        
        if (machineObj?.type === 'HIV' && patientObj && !patientObj.hiv_status) {
          activeAlerts.push({
            id: `hiv-${appt.id}`,
            type: 'warning',
            icon: <ShieldAlert size={18} />,
            title: 'HIV machine misuse warning',
            msg: `Standard patient ${patientObj.full_name} scheduled on HIV-dedicated machine #${machineObj.unit_number}`,
            patientId: patientObj.id
          });
        }
      }
    });

    // 3. Detect Missing Documentation (Consent Form mock logic)
    appointments.forEach(appt => {
      if (appt.date === todayStr && appt.status !== 'Cancelled') {
        const patientObj = patients.find(p => p.id === appt.patient);
        // Using "notes" as a proxy for missing documentation/consent in this demo
        if (patientObj && (!patientObj.notes || patientObj.notes.trim() === "")) {
          activeAlerts.push({
            id: `doc-${appt.id}`,
            type: 'info',
            icon: <ClipboardList size={18} />,
            title: 'Missing consent form',
            msg: `Patient ${patientObj.full_name} (ID: ${patientObj.patient_id}) - treatment documentation incomplete`,
            patientId: patientObj.id
          });
        }
      }
    });

    return activeAlerts;
  };

  const activeAlerts = generateDynamicAlerts();

  // Calculate Dynamic Stats
  const today = new Date().toISOString().split('T')[0];
  const todayAppts = appointments.filter(a => a.date === today);
  
  const totalSessions = todayAppts.length;
  const completedSessions = todayAppts.filter(a => a.status === 'Completed').length;
  const pendingSessions = totalSessions - completedSessions;
  
  // Real active machines (current session)
  const monitoringMachines = machines
    .sort((a, b) => a.unit_number - b.unit_number)
    .map(m => ({
      ...m,
      currentStatus: getMachineStatus(m.id)
    }));

  const activeMachinesCount = monitoringMachines.filter(m => m.currentStatus === 'In Use').length;
  const totalMachinesCount = machines.length;
  
  const uniquePatientsCount = new Set(todayAppts.map(a => a.patient)).size;
  
  const utilizationPercent = totalMachinesCount > 0 ? Math.round((activeMachinesCount / totalMachinesCount) * 100) : 0;

  const stats = [
    { 
      id: 1, 
      icon: <Calendar />, 
      label: 'Sessions Scheduled', 
      value: totalSessions.toString(), 
      sub: `${completedSessions} completed • ${pendingSessions} pending` 
    },
    { 
      id: 2, 
      icon: <Activity />, 
      label: 'Machines Active', 
      value: `${activeMachinesCount}/${totalMachinesCount}`, 
      sub: `${monitoringMachines.filter(m => m.type === 'Standard' && m.currentStatus === 'In Use').length} standard • ${monitoringMachines.filter(m => m.type === 'HIV' && m.currentStatus === 'In Use').length} HIV` 
    },
    { 
      id: 3, 
      icon: <TrendingUp />, 
      label: 'Utilization Rate', 
      value: `${utilizationPercent}%`, 
      sub: `Based on ${activeMachinesCount} active sessions` 
    },
    { 
      id: 4, 
      icon: <Users />, 
      label: 'Patients Scheduled', 
      value: uniquePatientsCount.toString(), 
      sub: 'Unique patients today' 
    }
  ];

  const secondaryStats = [
    { id: 5, icon: <UserPlus />, label: 'Staff on Duty', value: '12', sub: '8 nurses • 4 techs' },
    { id: 6, icon: <Package />, label: 'Inventory', value: '5', sub: '3 critical items' },
    { id: 7, icon: <CreditCard />, label: 'Billing', value: '18', sub: '7 overdue invoices' },
    { id: 8, icon: <CheckCircle2 />, label: 'Compliance', value: '98%', sub: '142 audits passed' },
  ];

  const quickActions = [
    { icon: <UserPlus />, label: 'Add New Patient', desc: 'Register new profile' },
    { icon: <Calendar />, label: 'Create Schedule', desc: 'Book machine slot' },
    { icon: <ClipboardList />, label: 'Log Treatment', desc: 'Record session data' },
    { icon: <FileText />, label: 'Generate Invoice', desc: 'Create billing record' },
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
      <div className="stats-row">
        {stats.map(stat => (
          <div key={stat.id} className="stat-box card">
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
                  <span className="sched-duration-label">3h session</span>
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
                  <span className={`status-pill ${item.status?.toLowerCase().replace(' ', '-')}`}>
                    {item.status === 'Completed' && <CheckCircle2 size={12} />}
                    {item.status}
                  </span>
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
                <button key={idx} className="action-tile">
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
          <div className="machine-legend">
            <span className="leg-item"><span className="dot available"></span> Free</span>
            <span className="leg-item"><span className="dot busy"></span> Busy</span>
            <span className="leg-item"><span className="dot hiv"></span> HIV Dedicated</span>
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
    </div>
  );
};

export default Dashboard;
