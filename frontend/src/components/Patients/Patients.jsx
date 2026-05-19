import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PatientModal from './PatientModal';
import { patientService, appointmentService } from '../../services/api';
import './Patients.css';

const formatDate = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const Patients = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [hivFilter, setHivFilter] = useState('Any HIV Status');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const navigate = useNavigate();

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const [patRes, apptRes] = await Promise.all([
        patientService.getAll(),
        appointmentService.getAll(),
      ]);
      setPatients(patRes.data);
      setAppointments(apptRes.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const getPatientSessionInfo = (patientId) => {
    const patientAppts = appointments.filter((a) => a.patient === patientId);
    const past = patientAppts
      .filter((a) => a.date < todayStr || (a.date === todayStr && a.status === 'Completed'))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    return {
      lastSession: past[0] || null,
    };
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      (patient?.full_name?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (patient?.patient_id?.toLowerCase() || '').includes(search.toLowerCase()) ||
      (patient?.date_of_birth && patient.date_of_birth.includes(search));
    
    const matchesStatus = 
      statusFilter === 'All Status' || patient?.status === statusFilter;
    
    const matchesHiv = 
      hivFilter === 'Any HIV Status' || 
      (hivFilter === 'Positive' && patient?.hiv_status === true) ||
      (hivFilter === 'Negative' && patient?.hiv_status === false);

    return matchesSearch && matchesStatus && matchesHiv;
  });

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedPatient(null);
    setIsModalOpen(true);
  };

  const handleDeletePatient = async (patientId, patientName) => {
    if (window.confirm(`Are you sure you want to permanently delete the records for ${patientName}? This action cannot be undone.`)) {
      try {
        await patientService.delete(patientId);
        fetchPatients();
      } catch (error) {
        console.error('Error deleting patient:', error);
        alert('Failed to delete patient. Ensure there are no active treatment sessions linked to this record.');
      }
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('All Status');
    setHivFilter('Any HIV Status');
  };

  return (
    <div className="patients-container">
      <header className="patients-header">
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
          <select 
            className="filter-select" 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option>All Status</option>
            <option>Active</option>
            <option>Inactive</option>
            <option>Transferred</option>
            <option>Deceased</option>
          </select>
          <select 
            className="filter-select"
            value={hivFilter}
            onChange={(e) => setHivFilter(e.target.value)}
          >
            <option>Any HIV Status</option>
            <option>Negative</option>
            <option>Positive</option>
          </select>
          <button className="clear-filters" onClick={clearFilters}>Clear Filters</button>
        </div>
        <div className="filters-right">
          <span className="patient-count">Showing <strong>{filteredPatients.length}</strong> patients</span>
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
              <th className="col-machine">Assigned Machine</th>
              <th className="col-status">Status</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>Loading data...</td></tr>
            ) : filteredPatients.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>No patients found</td></tr>
            ) : (
              filteredPatients.map(patient => {
                const { lastSession } = getPatientSessionInfo(patient.id);
                const statusText = patient.status || 'Active';
                return (
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
                  <td className="col-last td-muted">
                    {lastSession ? formatDate(lastSession.date) : '—'}
                  </td>
                  <td className="col-machine">
                    {lastSession?.machine_unit ? (
                      <span className="machine-badge">M-{lastSession.machine_unit}</span>
                    ) : (
                      <span className="td-muted">—</span>
                    )}
                  </td>
                  <td className="col-status">
                    <span className={`status-pill-new ${statusText.toLowerCase()}`}>
                      {statusText}
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
                          handleDeletePatient(patient.id, patient.full_name);
                        }}
                      />
                    </div>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="pagination-container">
          <div className="pagination-info">
            Showing <strong>1-{Math.min(5, filteredPatients.length)}</strong> of <strong>{filteredPatients.length}</strong> registered patients
          </div>
          <div className="page-numbers">
            <div className="page-btn nav"><ChevronLeft size={16} /></div>
            {[...Array(Math.ceil(filteredPatients.length / 5) || 1)].map((_, i) => (
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
