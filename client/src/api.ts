import axios, { AxiosResponse } from "axios";

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

// Types for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  error?: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Setting {
  id?: string;
  user_id: string;
  setting_key: string;
  setting_value: string;
  created_at?: string;
  updated_at?: string;
}

export interface BacktestRequest {
  strategy: string;
  symbols: string | string[];
  startDate: string;
  endDate: string;
  window: number;
  threshold: number;
  initialCapital: number;
  sharesPerTrade: number;
}

export interface BacktestResult {
  symbol: string;
  totalReturn: number;
  finalPortfolioValue: number;
  winRate: number;
  maxDrawdown: number;
  totalTrades: number;
}

export interface BacktestResponse {
  results: BacktestResult[];
}

export interface Strategy {
  name: string;
  description?: string;
  parameters?: Record<string, any>;
}

export interface SymbolOption {
  symbol: string;
  name: string;
  exchange: string;
  type?: string;
  market?: string;
}

export interface SearchResponse {
  symbols: SymbolOption[];
  query: string;
  source: 'yahoo-finance' | 'static';
  count?: number;
}

// Auth API
export const signup = (data: { username: string; password: string; email?: string }): Promise<AxiosResponse<ApiResponse<AuthResponse>>> => 
  api.post('/auth/signup', data);

export const login = (data: { username: string; password: string }): Promise<AxiosResponse<ApiResponse<AuthResponse>>> => 
  api.post('/auth/login', data);

export const logout = (): Promise<AxiosResponse<ApiResponse>> => 
  api.post('/auth/logout');

export const getCurrentUser = (): Promise<AxiosResponse<ApiResponse<User>>> => 
  api.get('/auth/me');

// Settings API
export const getSettings = (user_id: string): Promise<AxiosResponse<Setting[]>> => 
  api.get(`/settings/${user_id}`);

export const saveSetting = (data: { user_id: string; setting_key: string; setting_value: string }): Promise<AxiosResponse<ApiResponse>> => 
  api.post('/settings', data);

// Backtest API
export const runBacktest = (data: BacktestRequest): Promise<AxiosResponse<ApiResponse<BacktestResponse>>> => 
  api.post('/backtest/run', data);

export const getStrategies = (): Promise<AxiosResponse<ApiResponse<{ strategies: Strategy[] }>>> => 
  api.get('/backtest/strategies');

export const getBacktestHealth = (): Promise<AxiosResponse<ApiResponse>> => 
  api.get('/backtest/health');

// Symbol lookup API
export const searchSymbols = (query: string, useYahoo: boolean = true): Promise<AxiosResponse<ApiResponse<SearchResponse>>> => 
  api.get(`/symbols/search?q=${encodeURIComponent(query)}&useYahoo=${useYahoo}`);

export const searchWithYahoo = (query: string): Promise<AxiosResponse<ApiResponse<SearchResponse>>> => 
  api.get(`/symbols/yahoo-search?q=${encodeURIComponent(query)}`);

export const getPopularSymbols = (): Promise<AxiosResponse<ApiResponse<{ symbols: SymbolOption[] }>>> => 
  api.get('/symbols/popular');
