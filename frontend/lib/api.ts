// frontend/src/lib/api.ts
import axios from 'axios';

// Normalize API base: allow NEXT_PUBLIC_API_URL to be provided either
// with or without the trailing `/api` segment. If it's absent, we
// append `/api`. This prevents calls like /auth/... going to the
// host root (which was causing the missing CORS headers / 404s).
const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL;
// Ensure base always ends with a single trailing slash (e.g. https://host/api/)
const API_BASE = RAW_API_URL ? RAW_API_URL.replace(/\/+$/, '') + '/api/' : 'http://localhost:8000/api/';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Normalize outgoing request URLs: many files call api.get('/auth/...') with a leading
// slash. In axios a url starting with '/' replaces the path portion of the baseURL
// (causing /api to be dropped). Strip leading slashes here so requests like
// '/auth/profile/' become 'auth/profile/' and concatenate correctly with
// baseURL 'https://host/api/'.
api.interceptors.request.use((config) => {
  if (config.url && typeof config.url === 'string') {
    config.url = config.url.replace(/^\/+/, '');
  }
  return config;
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(
          `${API_BASE}auth/token/refresh/`,
          { refresh: refreshToken }
        );

        const newAccessToken = response.data.access;
        localStorage.setItem('access_token', newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
