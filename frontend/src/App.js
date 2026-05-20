import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import Patients from './components/Patients/Patients';
import PatientProfile from './components/Patients/PatientProfile';
import Scheduling from './components/Scheduling/Scheduling';
import Machines from './components/Machines/Machines';
import Staff from './components/Staff/Staff';
import StaffProfile from './components/Staff/StaffProfile';
import MachineProfile from './components/Machines/MachineProfile';
import Inventory from './components/Inventory/Inventory';
import Billing from './components/Billing/Billing';
import Attendance from './components/Attendance/Attendance';
import Login from './components/Login/Login';
import Register from './components/Login/Register';
import UserManagement from './components/Users/UserManagement';
import History from './components/History/History';
import Notifications from './components/Notifications/Notifications';
import ProtectedRoute from './components/Login/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import StethoscopeLoader from './components/Loader/StethoscopeLoader';
import './App.css';

function App() {
  return (
    <LoadingProvider>
      <AuthProvider>
        <Router>
          <StethoscopeLoader />
          <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected app */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/patients" element={<Patients />} />
                    <Route path="/patients/:id" element={<PatientProfile />} />
                    <Route path="/machines" element={<Machines />} />
                    <Route path="/machines/:id" element={<MachineProfile />} />
                    <Route path="/sessions" element={<Scheduling />} />
                    <Route path="/staff" element={<Staff />} />
                    <Route path="/staff/:id" element={<StaffProfile />} />
                    <Route path="/attendance" element={<Attendance />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/users" element={<UserManagement />} />
                    <Route path="/history" element={<History />} />
                    <Route path="/notifications" element={<Notifications />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  </LoadingProvider>
  );
}

export default App;
