import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  UserSquare2, 
  Package, 
  Receipt, 
  ShieldCheck, 
  Bell, 
  Settings,
  Stethoscope,
  Monitor
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const menuItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', path: '/' },
    { icon: <Users size={18} />, label: 'Patients', path: '/patients' },
    { icon: <Monitor size={18} />, label: 'Machine', path: '/machines' },
    { icon: <CalendarCheck size={18} />, label: 'Sessions', path: '/sessions' },
    { icon: <UserSquare2 size={18} />, label: 'Staff', path: '/staff' },
    { icon: <Package size={18} />, label: 'Inventory', path: '/inventory' },
    { icon: <Receipt size={18} />, label: 'Billing', path: '/billing' },
    { icon: <ShieldCheck size={18} />, label: 'Compliance & Audit Logs', path: '/compliance' },
    { icon: <Bell size={18} />, label: 'Notifications', path: '/notifications', badge: 3 },
    { icon: <Settings size={18} />, label: 'Settings', path: '/settings' },
  ];

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
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" alt="avatar" />
          </div>
          <div className="user-info">
            <span className="user-name">Dr. Admin</span>
            <span className="user-email">admin@center.com</span>
          </div>
          <button className="logout-mini">
            <Settings size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
