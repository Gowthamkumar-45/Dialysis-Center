import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarOff,
  Hourglass,
  LogIn,
  LogOut,
  Filter,
  Download,
  RefreshCcw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { attendanceService, getFullImageUrl } from '../../services/api';
import './Attendance.css';

const STATUS_OPTIONS = [
  { value: 'Present', label: 'Present', color: 'present', icon: CheckCircle2 },
  { value: 'Late', label: 'Late', color: 'late', icon: Clock },
  { value: 'Half-Day', label: 'Half-Day', color: 'halfday', icon: Hourglass },
  { value: 'Leave', label: 'On Leave', color: 'leave', icon: CalendarOff },
  { value: 'Absent', label: 'Absent', color: 'absent', icon: XCircle },
];

const ROLE_FILTERS = ['All', 'Doctor', 'Nurse', 'Technician', 'Support'];

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const Attendance = () => {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [roster, setRoster] = useState([]);
  const [summary, setSummary] = useState({
    total_staff: 0, present: 0, absent: 0, late: 0, half_day: 0, leave: 0, unmarked: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [savingId, setSavingId] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchRoster = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await attendanceService.getRoster(selectedDate);
      setRoster(data.roster || []);
      setSummary(data.summary || {});
    } catch (err) {
      console.error('Error fetching attendance roster:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchRoster();
  }, [fetchRoster]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter, selectedDate]);

  const isToday = selectedDate === todayISO();

  const filteredRoster = useMemo(() => {
    return roster.filter((r) => {
      const matchesSearch =
        !searchTerm ||
        r.staff_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.staff_email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'All' || r.staff_role === roleFilter;
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roster, searchTerm, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredRoster.length / itemsPerPage) || 1;
  const paginatedRoster = useMemo(() => {
    return filteredRoster.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredRoster, currentPage]);

  const avatarFor = (entry) => {
    return (
      getFullImageUrl(entry.staff_photo) ||
      entry.staff_avatar_url ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(entry.staff_name || 'staff')}`
    );
  };

  const updateRecord = async (entry, payload) => {
    try {
      setSavingId(entry.staff_id);
      const body = {
        staff: entry.staff_id,
        date: selectedDate,
        ...payload,
      };
      const { data } = await attendanceService.create(body);
      setRoster((prev) =>
        prev.map((r) =>
          r.staff_id === entry.staff_id
            ? {
                ...r,
                attendance_id: data.id,
                status: data.status,
                check_in: data.check_in,
                check_out: data.check_out,
                work_hours: data.work_hours,
                notes: data.notes,
              }
            : r
        )
      );
      // Recompute summary locally
      setSummary((s) => recomputeSummary(roster.map((r) => (r.staff_id === entry.staff_id ? { ...r, status: data.status } : r)), s.total_staff));
    } catch (err) {
      console.error('Error saving attendance:', err);
      alert('Failed to save attendance.');
    } finally {
      setSavingId(null);
      setOpenMenu(null);
    }
  };

  const recomputeSummary = (newRoster, totalFallback) => ({
    total_staff: totalFallback ?? newRoster.length,
    present: newRoster.filter((r) => r.status === 'Present').length,
    absent: newRoster.filter((r) => r.status === 'Absent').length,
    late: newRoster.filter((r) => r.status === 'Late').length,
    half_day: newRoster.filter((r) => r.status === 'Half-Day').length,
    leave: newRoster.filter((r) => r.status === 'Leave').length,
    unmarked: newRoster.filter((r) => r.status === 'Unmarked').length,
  });

  const handleStatusChange = (entry, newStatus) => {
    updateRecord(entry, { status: newStatus });
  };

  const handleCheckIn = async (entry) => {
    try {
      setSavingId(entry.staff_id);
      const { data } = await attendanceService.checkIn(entry.staff_id);
      setRoster((prev) =>
        prev.map((r) =>
          r.staff_id === entry.staff_id
            ? {
                ...r,
                attendance_id: data.id,
                status: data.status,
                check_in: data.check_in?.slice(0, 5),
                work_hours: data.work_hours,
              }
            : r
        )
      );
    } catch (err) {
      console.error('Check-in failed:', err);
      alert(err?.response?.data?.detail || 'Check-in failed.');
    } finally {
      setSavingId(null);
    }
  };

  const handleCheckOut = async (entry) => {
    try {
      setSavingId(entry.staff_id);
      const { data } = await attendanceService.checkOut(entry.staff_id);
      setRoster((prev) =>
        prev.map((r) =>
          r.staff_id === entry.staff_id
            ? { ...r, check_out: data.check_out?.slice(0, 5), work_hours: data.work_hours }
            : r
        )
      );
    } catch (err) {
      console.error('Check-out failed:', err);
      alert(err?.response?.data?.detail || 'Check-out failed.');
    } finally {
      setSavingId(null);
    }
  };

  const handleMarkAllPresent = async () => {
    if (!window.confirm('Mark all unmarked staff as Present for this date?')) return;
    const targets = roster.filter((r) => r.status === 'Unmarked');
    for (const entry of targets) {
      // eslint-disable-next-line no-await-in-loop
      await updateRecord(entry, { status: 'Present' });
    }
    fetchRoster();
  };

  const exportCSV = () => {
    const headers = ['Staff Name', 'Role', 'Email', 'Status', 'Check In', 'Check Out', 'Work Hours', 'Notes'];
    const rows = filteredRoster.map((r) => [
      r.staff_name, r.staff_role, r.staff_email, r.status,
      r.check_in || '-', r.check_out || '-', r.work_hours || 0, r.notes || '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusMeta = (status) =>
    STATUS_OPTIONS.find((s) => s.value === status) || { color: 'unmarked', label: 'Unmarked', icon: Hourglass };

  return (
    <div className="att-container" onClick={() => setOpenMenu(null)}>
      {/* Hero header */}
      <header className="att-header">
        <div className="att-header-left">
          <div className="att-date-block">
            <Calendar size={18} className="att-cal-ico" />
            <div>
              <div className="att-date-label">{formatDate(selectedDate)}</div>
              <div className="att-date-sub">{isToday ? 'Today' : 'Historical view'}</div>
            </div>
          </div>
        </div>
        <div className="att-header-right">
          <div className="att-date-picker">
            <Calendar size={16} />
            <input
              type="date"
              value={selectedDate}
              max={todayISO()}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button className="att-btn att-btn-ghost" onClick={fetchRoster}>
            <RefreshCcw size={16} /> Refresh
          </button>
          <button className="att-btn att-btn-ghost" onClick={exportCSV} disabled={!filteredRoster.length}>
            <Download size={16} /> Export
          </button>
          {isToday && (
            <button className="att-btn att-btn-primary" onClick={handleMarkAllPresent} disabled={!summary.unmarked}>
              <Sparkles size={16} /> Mark All Present
            </button>
          )}
        </div>
      </header>

      {/* Stat cards */}
      <section className="att-stats">
        <StatCard label="Present" value={summary.present} tone="present" Icon={CheckCircle2} />
        <StatCard label="Late" value={summary.late} tone="late" Icon={Clock} />
        <StatCard label="Half-Day" value={summary.half_day} tone="halfday" Icon={Hourglass} />
        <StatCard label="On Leave" value={summary.leave} tone="leave" Icon={CalendarOff} />
        <StatCard label="Absent" value={summary.absent} tone="absent" Icon={XCircle} />
      </section>

      {/* Controls */}
      <div className="att-controls-wrap">
        <div className="att-search-standalone">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="att-filter-row">
          <div className="att-filter-group">
            <Filter size={14} className="att-filter-ico" />
            <span className="att-filter-label">Role:</span>
            <select
              className="att-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              {ROLE_FILTERS.map((f) => (
                <option key={f} value={f}>{f === 'All' ? 'All Roles' : f}</option>
              ))}
            </select>
          </div>
          <div className="att-filter-group">
            <span className="att-filter-label">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="att-select"
            >
              <option value="All">All Status</option>
              <option value="Unmarked">Unmarked</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <section className="att-table-wrap">
        {loading ? (
          <div className="att-empty">Loading attendance…</div>
        ) : paginatedRoster.length === 0 ? (
          <div className="att-empty">
            {roster.length === 0
              ? 'No staff members registered yet.'
              : 'No records match your filters.'}
          </div>
        ) : (
          <>
            <table className="att-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>In</th>
                  <th>Out</th>
                  <th>Hours</th>
                  <th className="att-actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRoster.map((entry) => {
                const meta = statusMeta(entry.status);
                const StatusIcon = meta.icon;
                const isSaving = savingId === entry.staff_id;
                return (
                  <tr key={entry.staff_id} className={isSaving ? 'is-saving' : ''}>
                    <td>
                      <div className="att-staff-cell">
                        <img src={avatarFor(entry)} alt={entry.staff_name} className="att-avatar" />
                        <div className="att-staff-meta">
                          <div className="att-staff-name">{entry.staff_name}</div>
                          <div className="att-staff-sub">{entry.staff_email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="att-role-chip">{entry.staff_role}</span>
                    </td>
                    <td>
                      <div className="att-status-cell">
                        <button
                          className={`att-status-pill ${meta.color}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu === entry.staff_id ? null : entry.staff_id);
                          }}
                        >
                          <StatusIcon size={13} />
                          <span>{meta.label}</span>
                          <ChevronDown size={13} className="att-chev" />
                        </button>
                        {openMenu === entry.staff_id && (
                          <div className="att-status-menu" onClick={(e) => e.stopPropagation()}>
                            {STATUS_OPTIONS.map((opt) => {
                              const OptIcon = opt.icon;
                              const isSelected = entry.status === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  className={`att-status-menu-item ${opt.color} ${isSelected ? 'selected' : ''}`}
                                  onClick={() => handleStatusChange(entry, opt.value)}
                                >
                                  <OptIcon size={14} />
                                  <span>{opt.label}</span>
                                  {isSelected && <div className="selected-dot" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="att-time">{entry.check_in || '—'}</span>
                    </td>
                    <td>
                      <span className="att-time">{entry.check_out || '—'}</span>
                    </td>
                    <td>
                      <span className={`att-hours ${entry.work_hours > 0 ? 'has-value' : ''}`}>
                        {entry.work_hours ? `${entry.work_hours}h` : '—'}
                      </span>
                    </td>
                    <td className="att-actions-col">
                      <div className="att-actions">
                        {isToday && (
                          <>
                            <button
                              className="att-action-btn att-checkin"
                              onClick={() => handleCheckIn(entry)}
                              disabled={!!entry.check_in || isSaving}
                              title={entry.check_in ? 'Already in' : 'In'}
                            >
                              <LogIn size={14} />
                              In
                            </button>
                            <button
                              className="att-action-btn att-checkout"
                              onClick={() => handleCheckOut(entry)}
                              disabled={!entry.check_in || !!entry.check_out || isSaving}
                              title={!entry.check_in ? 'Mark In first' : entry.check_out ? 'Already out' : 'Out'}
                            >
                              <LogOut size={14} />
                              Out
                            </button>
                          </>
                        )}
                        {!isToday && <span className="att-readonly-tag">View only</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <footer className="att-footer">
            <div className="att-pagination">
              <button 
                className="pag-btn" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="pag-number">{currentPage}</span>
              <button 
                className="pag-btn" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </footer>
          </>
        )}
      </section>
    </div>
  );
};

const StatCard = ({ label, value, tone, Icon }) => (
  <div className={`att-stat-card tone-${tone}`}>
    <div className="att-stat-text">
      <p className="att-stat-label">{label}</p>
      <div className="att-stat-value">{value ?? 0}</div>
    </div>
    <div className="att-stat-ico">
      <Icon size={22} />
    </div>
  </div>
);

export default Attendance;
