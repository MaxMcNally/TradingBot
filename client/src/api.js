import axios from "axios";

const API_BASE = "http://localhost:8001/api";

// Auth API
export const signup = (data) => axios.post(`${API_BASE}/auth/signup`, data, { withCredentials: true });
export const login = (data) => axios.post(`${API_BASE}/auth/login`, data, { withCredentials: true });
export const logout = () => axios.post(`${API_BASE}/auth/logout`);

// Settings API
export const getSettings = (user_id) =>
  axios.get(`${API_BASE}/settings/${user_id}`);
export const saveSetting = (data) => axios.post(`${API_BASE}/settings`, data);

// Backtest API
export const runBacktest = (data) => axios.post(`${API_BASE}/backtest/run`, data);
export const getStrategies = () => axios.get(`${API_BASE}/backtest/strategies`);
export const getBacktestHealth = () => axios.get(`${API_BASE}/backtest/health`);

// Symbol lookup API
export const searchSymbols = (query) => axios.get(`${API_BASE}/symbols/search?q=${encodeURIComponent(query)}`);
export const getPopularSymbols = () => axios.get(`${API_BASE}/symbols/popular`);
