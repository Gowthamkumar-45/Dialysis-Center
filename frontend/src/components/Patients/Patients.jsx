import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PatientModal from './PatientModal';
import { patientService } from '../../services/api';
import './Patients.css';

const Patients = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const navigate = useNavigate();

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await patientService.getAll();
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedPatient(null);
    setIsModalOpen(true);
  };

  return (
    <div className="patients-container">
      <header className="patients-header">
        <div className="title-section">
          <h1>Patients</h1>

        </div>
        <button className="add-patient-btn no-border shadow-vibrant" onClick={handleAdd}>
          <Plus size={20} />
          <span>New Patient</span>
        </button>
      </header>

      <div className="filters-bar-new">
        <div className="filters-left">
          <div className="search-container">
            <Search className="search-icon-abs" size={18} />
            <input
              type="text"
              placeholder="Search by name, ID, or DOB..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="filter-select">
            <option>All Status</option>
            <option>Active</option>
            <option>Pending</option>
            <option>Inactive</option>
          </select>
          <select className="filter-select">
            <option>Any HIV Status</option>
            <option>Negative</option>
            <option>Positive</option>
          </select>
          <button className="clear-filters">Clear Filters</button>
        </div>
        <div className="filters-right">
          <span className="patient-count">Showing <strong>{patients.length}</strong> patients</span>
        </div>
      </div>

      <div className="table-card">
        <table className="patients-table-new">
          <thead>
            <tr>
              <th className="col-id">Patient ID</th>
              <th className="col-patient">Patient Name</th>
              <th className="col-dob">Date of Birth</th>
              <th className="col-last">Last Session</th>
              <th className="col-next">Next Session</th>
              <th className="col-machine">Assigned Machine</th>
              <th className="col-status">Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>Loading data...</td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '3rem' }}>No patients found</td></tr>
            ) : (
              patients.map(patient => (
                 <tr 
                  key={patient.id} 
                  onClick={() => navigate(`/patients/${patient.id}`)}
                  className="patient-row-clickable"
                >
                  <td className="col-id">
                    <span className="p-id-sub">{patient.patient_id}</span>
                  </td>
                  <td className="col-patient">
                    <div className="patient-info-box">
                      <div className="p-text-group">
                        <div className="p-name-tag">
                          <span className="p-name-main">{patient.full_name}</span>
                          {patient.hiv_status && <span className="hiv-tag-small">HIV+</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="col-dob td-bold">{patient.date_of_birth || 'N/A'}</td>
                  <td className="col-last td-muted">Oct 24, 2023</td>
                  <td className="col-next">
                    <div className="next-session-box">
                      <span className="td-bold">Oct 27, 2023</span>
                      <span className="next-time"><Clock size={12} /> 09:00 AM</span>
                    </div>
                  </td>
                  <td className="col-machine">
                    <span className="machine-badge">M-04</span>
                  </td>
                  <td className="col-status">
                    <span className={`status-pill-new ${patient.status.toLowerCase()}`}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="action-btns-row">
                      <Edit 
                        size={36} 
                        className="action-icon-btn edit" 
                        strokeWidth={2} 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(patient);
                        }}
                      />
                      <Trash2 
                        size={36} 
                        className="action-icon-btn delete" 
                        strokeWidth={2} 
                        onClick={(e) => {
                          e.stopPropagation();
                          // delete logic
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="pagination-container">
          <div className="pagination-info">
            Showing <strong>1-{Math.min(5, patients.length)}</strong> of <strong>{patients.length}</strong> registered patients
          </div>
          <div className="page-numbers">
            <div className="page-btn nav"><ChevronLeft size={16} /></div>
            {[...Array(Math.ceil(patients.length / 5) || 1)].map((_, i) => (
              <div key={i} className={`page-btn ${i === 0 ? 'active' : ''}`}>
                {i + 1}
              </div>
            ))}
            <div className="page-btn nav"><ChevronRight size={16} /></div>
          </div>
        </div>
      </div>

      <PatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRefresh={fetchPatients}
        patient={selectedPatient}
      />
    </div>
  );
};

export default Patients;
