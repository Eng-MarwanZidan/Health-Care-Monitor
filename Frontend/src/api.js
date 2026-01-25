import axios from 'axios';

// Use different endpoints based on environment
const API_URL =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8000/api'
    : '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    
    // Only attempt refresh if 401, not already retried, and we have a refresh token
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      
      // Don't attempt refresh on the refresh endpoint itself
      if (refreshToken && !original.url?.includes('/auth/token/refresh/')) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/token/refresh/`, { refresh: refreshToken });
          localStorage.setItem('access_token', data.access);
          // Update refresh token if a new one was issued (token rotation)
          if (data.refresh) {
            localStorage.setItem('refresh_token', data.refresh);
          }
          api.defaults.headers.common.Authorization = `Bearer ${data.access}`;
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth APIs
export const authAPI = {
  login: (username, password) => api.post('/auth/login/', { username, password }),
  register: (username, email, password, password2) => api.post('/auth/register/', { username, email, password, password2 }),
  refresh: (refresh) => api.post('/auth/token/refresh/', { refresh }),
  getProfile: () => api.get('/auth/me/'),
};

// Patient APIs
export const patientAPI = {
  list: () => api.get('/health/patients/'),
  create: (data) => api.post('/health/patients/', data),
  get: (id) => api.get(`/health/patients/${id}/`),
  update: (id, data) => api.patch(`/health/patients/${id}/`, data),
  delete: (id) => api.delete(`/health/patients/${id}/`),
};

// Measurement APIs
export const measurementAPI = {
  list: (patientId) => api.get(`/health/patients/${patientId}/measurements/`),
  create: (patientId, data) => api.post(`/health/patients/${patientId}/measurements/`, data),
  get: (id) => api.get(`/health/measurements/${id}/`),
  delete: (id) => api.delete(`/health/measurements/${id}/`),
};

// Prediction APIs
export const predictionAPI = {
  get: (measurementId) => api.get(`/health/measurements/${measurementId}/prediction/`),
};
