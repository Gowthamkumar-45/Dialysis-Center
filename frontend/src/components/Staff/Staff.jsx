import React from 'react';
import { UserSquare2, Mail, Phone, MapPin, MoreVertical, Plus, Filter } from 'lucide-react';
import './Staff.css';

const Staff = () => {
  const staffMembers = [
    { id: 1, name: 'Dr. Sarah Wilson', role: 'Chief Nephrologist', email: 'sarah.w@dialycare.com', phone: '+1 234 567 8901', status: 'On Duty', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah' },
    { id: 2, name: 'James Martinez', role: 'Senior Nurse', email: 'james.m@dialycare.com', phone: '+1 234 567 8902', status: 'On Duty', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=james' },
    { id: 3, name: 'Emily Chen', role: 'Dialysis Technician', email: 'emily.c@dialycare.com', phone: '+1 234 567 8903', status: 'Off Duty', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emily' },
    { id: 4, name: 'Robert Brown', role: 'Support Staff', email: 'robert.b@dialycare.com', phone: '+1 234 567 8904', status: 'On Duty', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=robert' },
  ];

  return (
    <div className="staff-container">
      <header className="staff-header">
        <div className="title-section">
          <h1>Staff Directory</h1>
          <p>Manage medical and administrative personnel.</p>
        </div>
        <button className="add-staff-btn">
          <Plus size={20} />
          <span>Add Staff Member</span>
        </button>
      </header>

      <div className="staff-controls card">
        <div className="search-staff">
          <Filter size={18} />
          <input type="text" placeholder="Filter by name, role or status..." />
        </div>
        <div className="role-filters">
          <button className="role-pill active">All Staff</button>
          <button className="role-pill">Doctors</button>
          <button className="role-pill">Nurses</button>
          <button className="role-pill">Technicians</button>
        </div>
      </div>

      <div className="staff-grid">
        {staffMembers.map(member => (
          <div key={member.id} className="staff-card card">
            <div className="staff-card-header">
              <div className="staff-avatar">
                <img src={member.avatar} alt={member.name} />
                <span className={`status-indicator ${member.status.toLowerCase().replace(' ', '-')}`}></span>
              </div>
              <button className="more-btn"><MoreVertical size={18} /></button>
            </div>
            <div className="staff-info">
              <h3>{member.name}</h3>
              <span className="staff-role">{member.role}</span>
            </div>
            <div className="staff-contact">
              <div className="contact-item">
                <Mail size={14} />
                <span>{member.email}</span>
              </div>
              <div className="contact-item">
                <Phone size={14} />
                <span>{member.phone}</span>
              </div>
            </div>
            <div className="staff-footer">
              <button className="view-profile-btn">View Profile</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Staff;
