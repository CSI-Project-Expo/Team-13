import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Job APIs
export const jobAPI = {
  create: (data) => api.post('/jobs', data),
  getAll: (params) => api.get('/jobs', { params }),
  getById: (id) => api.get(`/jobs/${id}`),
  update: (id, data) => api.put(`/jobs/${id}`, data),
  delete: (id) => api.delete(`/jobs/${id}`),
};

// User APIs
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
};

// Wallet APIs
export const walletAPI = {
  getBalance: () => api.get('/wallet/balance'),
  getTransactions: () => api.get('/wallet/transactions'),
  addFunds: (amount) => api.post('/wallet/add-funds', { amount }),
};

// Offer APIs
export const offerAPI = {
  create: (data) => api.post('/offers', data),
  getByJob: (jobId) => api.get(`/offers/job/${jobId}`),
  accept: (id) => api.patch(`/offers/${id}/accept`),
  reject: (id) => api.patch(`/offers/${id}/reject`),
};

// Rating APIs  
export const ratingAPI = {
  create: (data) => api.post('/ratings', data),
};

// Complaint APIs
export const complaintAPI = {
  create: (data) => api.post('/complaints', data),
  getAll: () => api.get('/complaints'),
  updateStatus: (id, status) => api.patch(`/complaints/${id}/status`, { status }),
};

export default api;
