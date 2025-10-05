import axios from "axios";

const API_BASE = "http://localhost:8001/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const signup = (data) => api.post('/auth/signup', data);
export const login = (data) => api.post('/auth/login', data);
export const logout = () => api.post('/auth/logout');
export const getCurrentUser = () => api.get('/auth/me');

// Settings API
export const getSettings = (user_id) => api.get(`/settings/${user_id}`);
export const saveSetting = (data) => api.post('/settings', data);

// Backtest API
export const runBacktest = (data) => api.post('/backtest/run', data);
export const getStrategies = () => api.get('/backtest/strategies');
export const getBacktestHealth = () => api.get('/backtest/health');

// Symbol lookup API
export const searchSymbols = (query) => api.get(`/symbols/search?q=${encodeURIComponent(query)}`);
export const getPopularSymbols = () => api.get('/symbols/popular');
