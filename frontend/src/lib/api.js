import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('fenitel_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('fenitel_token');
      localStorage.removeItem('fenitel_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// Members
export const membersApi = {
  list: () => api.get('/members'),
  get: (id) => api.get(`/members/${id}`),
  toggleProvider: (id) => api.put(`/members/${id}/provider`),
};

// Contracts
export const contractsApi = {
  getMy: () => api.get('/contracts/my'),
  sign: () => api.post('/contracts/sign'),
  downloadPdf: (id) => api.get(`/contracts/${id}/pdf`, { responseType: 'blob' }),
};

// Payments
export const paymentsApi = {
  list: () => api.get('/payments'),
  update: (userId, data) => api.put(`/payments/${userId}`, data),
};

// Evidence
export const evidenceApi = {
  generateIdentity: (userId) => api.post(`/evidence/identity/${userId}`),
  getUserEvidence: (userId) => api.get(`/evidence/user/${userId}`),
  downloadPdf: (id) => api.get(`/evidence/${id}/pdf`, { responseType: 'blob' }),
};

// Datasets
export const datasetsApi = {
  list: (status) => api.get('/datasets', { params: { status } }),
  upload: (formData) => api.post('/datasets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getCatalog: () => api.get('/datasets/catalog'),
  validate: (id) => api.put(`/datasets/${id}/validate`),
  publish: (id) => api.put(`/datasets/${id}/publish`),
  download: (id) => api.get(`/datasets/${id}/download`, { responseType: 'blob' }),
};

// Audit
export const auditApi = {
  list: (params) => api.get('/audit', { params }),
  export: () => api.get('/audit/export', { responseType: 'blob' }),
};

// Governance
export const governanceApi = {
  listCommittee: () => api.get('/governance/committee'),
  addCommitteeMember: (data) => api.post('/governance/committee', data),
  removeCommitteeMember: (id) => api.delete(`/governance/committee/${id}`),
  listDecisions: () => api.get('/governance/decisions'),
  createDecision: (data) => api.post('/governance/decisions', data),
};

// Export
export const exportApi = {
  memberDossier: (memberId) => api.get(`/export/member/${memberId}`, { responseType: 'blob' }),
};

// Stats
export const statsApi = {
  get: () => api.get('/stats'),
};

export default api;
