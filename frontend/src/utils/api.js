import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor to attach CSRF token if present in cookies
api.interceptors.request.use((config) => {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  if (match) {
    config.headers['X-CSRFToken'] = match[1];
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
