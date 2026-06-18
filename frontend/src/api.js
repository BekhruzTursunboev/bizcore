import axios from 'axios';

// In production on Vercel, API and frontend share the same domain.
// So we use a relative base URL ('') which means requests go to the same host.
// In local dev, we fall back to localhost:5000.
const BASE = import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.PROD ? '' : 'http://localhost:5000');

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('bizcore_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('bizcore_token');
      localStorage.removeItem('bizcore_user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;
