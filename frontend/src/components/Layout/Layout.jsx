import React from 'react';
import Sidebar from './Sidebar';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../Notifications/NotificationBell';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const displayName = user
    ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username
    : 'Guest';
  const initial = (displayName || 'G').charAt(0).toUpperCase();
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard Overview';
    if (path === '/patients') return 'Patients Directory';
    if (path.startsWith('/patients/')) return 'Patient Profile';
    if (path === '/machines') return 'Dialysis Units';
    if (path.startsWith('/machines/')) return 'Unit Details';
    if (path === '/sessions') return 'Clinical Sessions';
    if (path === '/staff') return 'Staff Directory';
    if (path.startsWith('/staff/')) return 'Staff Profile';
    if (path === '/attendance') return 'Staff Attendance';
    if (path === '/inventory') return 'Inventory Management';
    if (path === '/billing') return 'Billing & Financials';
    if (path === '/users') return 'User Management';
    if (path === '/history') return 'Activity History';
    if (path === '/notifications') return 'Notifications';
    return 'Dialysis Center';
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <header className="content-header">
          <div className="header-title-area">
            <h1 className="header-page-title">
              {getPageTitle()}
            </h1>
          </div>
          <div className="header-right">
            <NotificationBell />
            <div className="user-profile-header">
              <div className="avatar-header">{initial}</div>
            </div>
          </div>
        </header>
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
