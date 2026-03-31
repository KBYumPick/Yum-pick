import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({ baseURL: API_BASE });

// 401 응답 시 자동 로그아웃 처리
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('yumpick_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('yumpick_token');
      localStorage.removeItem('yumpick_sessionId');
      window.location.href = '/setup';
    }
    return Promise.reject(error);
  },
);

export default api;
