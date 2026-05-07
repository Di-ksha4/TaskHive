import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

export const authAPI = {
  signup: (data) => API.post('/auth/signup', data),
  login: (data) => API.post('/auth/login', data),
  getProfile: () => API.get('/auth/profile'),
};

export const userAPI = {
  list: (params = {}) => API.get('/users', { params }),
};

export const projectAPI = {
  list: () => API.get('/projects'),
  get: (id) => API.get(`/projects/${id}`),
  create: (data) => API.post('/projects', data),
  update: (id, data) => API.put(`/projects/${id}`, data),
  remove: (id) => API.delete(`/projects/${id}`),
  addMember: (projectId, userId) => API.post(`/projects/${projectId}/members`, { userId }),
  removeMember: (projectId, memberId) => API.delete(`/projects/${projectId}/members/${memberId}`),
};

export const taskAPI = {
  list: () => API.get('/tasks'),
  get: (id) => API.get(`/tasks/${id}`),
  create: (data) => API.post('/tasks', data),
  update: (id, data) => API.put(`/tasks/${id}`, data),
  remove: (id) => API.delete(`/tasks/${id}`),
  addComment: (taskId, text) => API.post(`/tasks/${taskId}/comments`, { text }),
};

export const notificationAPI = {
  list: () => API.get('/notifications'),
  markRead: (id) => API.patch(`/notifications/${id}/read`),
  markAllRead: () => API.patch('/notifications/read-all'),
};

export const analyticsAPI = {
  dashboard: () => API.get('/analytics/dashboard'),
  overdue: () => API.get('/analytics/overdue-tasks'),
};

export default API;
