import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const patientService = {
  getAll: () => api.get('/patients/'),
  getById: (id) => api.get(`/patients/${id}/`),
  create: (data) => api.post('/patients/', data),
  update: (id, data) => api.patch(`/patients/${id}/`, data),
  delete: (id) => api.delete(`/patients/${id}/`),
};

export const machineService = {
  getAll: () => api.get('/machines/'),
  getById: (id) => api.get(`/machines/${id}/`),
  create: (data) => api.post('/machines/', data),
  update: (id, data) => api.patch(`/machines/${id}/`, data),
  delete: (id) => api.delete(`/machines/${id}/`),
};

export const staffService = {
  getAll: () => api.get('/staff/'),
  getById: (id) => api.get(`/staff/${id}/`),
};

export const appointmentService = {
  getAll: () => api.get('/appointments/'),
  create: (data) => api.post('/appointments/', data),
  update: (id, data) => api.patch(`/appointments/${id}/`, data),
  delete: (id) => api.delete(`/appointments/${id}/`),
};

export const treatmentSessionService = {
  getAll: () => api.get('/treatment-sessions/'),
  getById: (id) => api.get(`/treatment-sessions/${id}/`),
  create: (data) => api.post('/treatment-sessions/', data),
  update: (id, data) => api.patch(`/treatment-sessions/${id}/`, data),
  delete: (id) => api.delete(`/treatment-sessions/${id}/`),
};

export default api;
