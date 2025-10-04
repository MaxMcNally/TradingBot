import axios from "axios";

const API_BASE = "http://localhost:8001/api";

export const signup = (data) => axios.post(`${API_BASE}/auth/signup`, data, { withCredentials: true });
export const login = (data) => axios.post(`${API_BASE}/auth/login`, data, { withCredentials: true });
export const logout = () => axios.post(`${API_BASE}/auth/logout`);

export const getSettings = (user_id) =>
  axios.get(`${API_BASE}/settings/${user_id}`);
export const saveSetting = (data) => axios.post(`${API_BASE}/settings`, data);
