import React from 'react';
import Sidebar from './Sidebar';
import { Search, Bell } from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <header className="content-header">
          <div className="header-search-container">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Search patients, machines, staff..." />
          </div>
          <div className="header-right">
            <div className="notif-box">
              <Bell size={22} />
              <span className="notif-dot"></span>
            </div>
            <div className="user-profile-header">
              <div className="avatar-header">G</div>
              <span className="user-name-header">Gowtham Kumar</span>
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
