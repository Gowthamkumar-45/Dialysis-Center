import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  UserSquare2,
  Package,
  Receipt,
  LogOut,
  Stethoscope,
  Monitor,
  ClipboardCheck,
  ShieldPlus,
  History as HistoryIcon,
  Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/' },
    { icon: <Users size={18} />, label: 'Patients', path: '/patients' },
    { icon: <Monitor size={18} />, label: 'Machine', path: '/machines' },
    { icon: <CalendarCheck size={18} />, label: 'Sessions', path: '/sessions' },
    { icon: <UserSquare2 size={18} />, label: 'Staff', path: '/staff' },
    { icon: <ClipboardCheck size={18} />, label: 'Attendance', path: '/attendance' },
    { icon: <Package size={18} />, label: 'Inventory', path: '/inventory' },
    { icon: <Receipt size={18} />, label: 'Billing', path: '/billing' },
    { icon: <ShieldPlus size={18} />, label: ' New Users', path: '/users' },
    { icon: <HistoryIcon size={18} />, label: 'History', path: '/history' },
    { icon: <Bell size={18} />, label: 'Notifications', path: '/notifications' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const displayName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    : 'Dr. Admin';
  const displayEmail = user?.email || 'admin@center.com';
  const avatarSeed = user?.username || 'admin';

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo-box">
          <Stethoscope size={24} color="white" />
        </div>
        <div className="header-text">
          <h2>Dialysis Center</h2>
          <span>Admin Portal</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
          >
            <div className="nav-icon-label">
              {item.icon}
              <span>{item.label}</span>
            </div>
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="footer-user">
          <div className="user-avatar">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`} alt="avatar" />
          </div>
          <div className="user-info">
            <span className="user-name">{displayName}</span>
            <span className="user-email">{displayEmail}</span>
          </div>
          <button className="logout-mini" onClick={handleLogout} title="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
