import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';
export const MEDIA_BASE_URL = process.env.REACT_APP_MEDIA_URL || API_BASE_URL.replace(/\/api$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach token to every request if logged in
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  
  // Trigger loading loader if it is not a background/poll request
  const isBackground = config.url && config.url.includes('/notifications/unread_count/');
  if (!isBackground) {
    window.dispatchEvent(new CustomEvent('api-loading-start'));
  }
  return config;
});

// If we get a 401, clear stale token and bounce to login
api.interceptors.response.use(
  (response) => {
    const isBackground = response.config && response.config.url && response.config.url.includes('/notifications/unread_count/');
    if (!isBackground) {
      window.dispatchEvent(new CustomEvent('api-loading-end'));
    }
    return response;
  },
  (error) => {
    const isBackground = error.config && error.config.url && error.config.url.includes('/notifications/unread_count/');
    if (!isBackground) {
      window.dispatchEvent(new CustomEvent('api-loading-end'));
    }
    if (error.response && error.response.status === 401) {
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('authUser');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (username, password) =>
    api.post('/auth/login/', { username, password }),
  register: (data) => api.post('/auth/register/', data),
  logout: () => api.post('/auth/logout/'),
  me: () => api.get('/auth/me/'),
};

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
  bulkDelete: () => api.delete('/machines/bulk_delete/'),
};

export const staffService = {
  getAll: () => api.get('/staff/'),
  getById: (id) => api.get(`/staff/${id}/`),
  create: (data) => api.post('/staff/', data),
  update: (id, data) => api.patch(`/staff/${id}/`, data),
  delete: (id) => api.delete(`/staff/${id}/`),
};

export const inventoryService = {
  getAll: () => api.get('/inventory/'),
  getById: (id) => api.get(`/inventory/${id}/`),
  create: (data) => api.post('/inventory/', data),
  update: (id, data) => api.patch(`/inventory/${id}/`, data),
  delete: (id) => api.delete(`/inventory/${id}/`),
};

export const invoiceService = {
  getAll: () => api.get('/invoices/'),
  getById: (id) => api.get(`/invoices/${id}/`),
  create: (data) => api.post('/invoices/', data),
  update: (id, data) => api.patch(`/invoices/${id}/`, data),
  delete: (id) => api.delete(`/invoices/${id}/`),
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

export const serviceLogService = {
  getAll: () => api.get('/service-logs/'),
  create: (data) => api.post('/service-logs/', data),
};

export const notificationService = {
  getAll: (params) => api.get('/notifications/', { params }),
  getUnreadCount: () => api.get('/notifications/unread_count/'),
  markRead: (id) => api.post(`/notifications/${id}/mark_read/`),
  markAllRead: () => api.post('/notifications/mark_all_read/'),
  delete: (id) => api.delete(`/notifications/${id}/`),
  clearAll: () => api.delete('/notifications/clear_all/'),
};

export const activityService = {
  getAll: (params) => api.get('/activity/', { params }),
  getSummary: () => api.get('/activity/summary/'),
};

export const userService = {
  getAll: () => api.get('/users/'),
};

export const attendanceService = {
  getAll: (params) => api.get('/attendance/', { params }),
  getRoster: (date) => api.get('/attendance/daily_roster/', { params: { date } }),
  create: (data) => api.post('/attendance/', data),
  update: (id, data) => api.patch(`/attendance/${id}/`, data),
  delete: (id) => api.delete(`/attendance/${id}/`),
  checkIn: (staffId) => api.post('/attendance/check_in/', { staff: staffId }),
  checkOut: (staffId) => api.post('/attendance/check_out/', { staff: staffId }),
};

export default api;

export const getFullImageUrl = (url) => {
  if (!url) return null;
  
  // Handle object structure if backend returns it (e.g., { url: '...' })
  let actualUrl = typeof url === 'object' ? url.url : url;
  if (!actualUrl || typeof actualUrl !== 'string') return null;

  if (actualUrl.startsWith('http') || actualUrl.startsWith('data:') || actualUrl.startsWith('blob:')) {
    return actualUrl;
  }
  
  // Ensure a single slash between base and path
  const separator = actualUrl.startsWith('/') ? '' : '/';
  return `${MEDIA_BASE_URL}${separator}${actualUrl}`;
};
