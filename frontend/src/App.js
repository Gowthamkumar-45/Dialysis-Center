import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import Patients from './components/Patients/Patients';
import PatientProfile from './components/Patients/PatientProfile';
import Scheduling from './components/Scheduling/Scheduling';
import Machines from './components/Machines/Machines';
import Staff from './components/Staff/Staff';
import Inventory from './components/Inventory/Inventory';
import Billing from './components/Billing/Billing';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientProfile />} />
          <Route path="/machines" element={<Machines />} />
          <Route path="/sessions" element={<Scheduling />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/compliance" element={<div className="p-10 text-center"><h1>Compliance & Audit Logs</h1><p>Module integration in progress...</p></div>} />
          <Route path="/notifications" element={<div className="p-10 text-center"><h1>Notifications Center</h1><p>Module integration in progress...</p></div>} />
          <Route path="/settings" element={<div className="p-10 text-center"><h1>System Settings</h1><p>Module integration in progress...</p></div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
