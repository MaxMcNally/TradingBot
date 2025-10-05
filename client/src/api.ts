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
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      // If this is not a retry and we have a token, try to refresh it
      if (!originalRequest._retry && localStorage.getItem('authToken')) {
        originalRequest._retry = true;
        
        try {
          const response = await refreshToken();
          const { token } = response.data.data;
          
          // Update the stored token
          localStorage.setItem('authToken', token);
          
          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear local data but don't redirect
          console.log('Token refresh failed, clearing local data');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        }
      } else {
        // No token or refresh failed, clear local data but don't redirect
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
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

// User Strategy types
export interface UserStrategy {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  strategy_type: string;
  config: any;
  backtest_results?: any;
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateStrategyData {
  name: string;
  description?: string;
  strategy_type: string;
  config: any;
  backtest_results?: any;
  is_public?: boolean;
}

export interface UpdateStrategyData {
  name?: string;
  description?: string;
  strategy_type?: string;
  config?: any;
  backtest_results?: any;
  is_active?: boolean;
  is_public?: boolean;
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

export const refreshToken = (): Promise<AxiosResponse<ApiResponse<AuthResponse>>> => 
  api.post('/auth/refresh');

// Settings API
export const getSettings = (user_id: string): Promise<AxiosResponse<Setting[]>> => 
  api.get(`/settings/${user_id}`);

export const saveSetting = (data: { user_id: string; setting_key: string; setting_value: string }): Promise<AxiosResponse<ApiResponse>> => 
  api.post('/settings', data);

// Account Settings API
export const updateAccountSettings = (data: { name: string; email: string; username: string }): Promise<AxiosResponse<ApiResponse<User>>> => 
  api.put('/auth/account', data);

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

// User Strategies API
export const getUserStrategies = (userId: number, includeInactive: boolean = false): Promise<AxiosResponse<{ strategies: UserStrategy[]; count: number }>> => 
  api.get(`/strategies/users/${userId}/strategies?includeInactive=${includeInactive}`);

export const getStrategyById = (strategyId: number): Promise<AxiosResponse<{ strategy: UserStrategy }>> => 
  api.get(`/strategies/strategies/${strategyId}`);

export const createStrategy = (userId: number, data: CreateStrategyData): Promise<AxiosResponse<{ message: string; strategy: UserStrategy }>> => 
  api.post(`/strategies/users/${userId}/strategies`, data);

export const updateStrategy = (strategyId: number, data: UpdateStrategyData): Promise<AxiosResponse<{ message: string; strategy: UserStrategy }>> => 
  api.put(`/strategies/strategies/${strategyId}`, data);

export const deleteStrategy = (strategyId: number): Promise<AxiosResponse<{ message: string }>> => 
  api.delete(`/strategies/strategies/${strategyId}`);

export const deactivateStrategy = (strategyId: number): Promise<AxiosResponse<{ message: string }>> => 
  api.patch(`/strategies/strategies/${strategyId}/deactivate`);

export const activateStrategy = (strategyId: number): Promise<AxiosResponse<{ message: string }>> => 
  api.patch(`/strategies/strategies/${strategyId}/activate`);

export const saveStrategyFromBacktest = (userId: number, data: CreateStrategyData): Promise<AxiosResponse<{ message: string; strategy: UserStrategy }>> => 
  api.post(`/strategies/users/${userId}/strategies/from-backtest`, data);

// Public Strategies API
export const getPublicStrategies = (): Promise<AxiosResponse<{ strategies: UserStrategy[]; count: number }>> => 
  api.get('/strategies/strategies/public');

export const getPublicStrategiesByType = (strategyType: string): Promise<AxiosResponse<{ strategies: UserStrategy[]; count: number }>> => 
  api.get(`/strategies/strategies/public/${strategyType}`);

export const copyPublicStrategy = (userId: number, strategyId: number, customName?: string): Promise<AxiosResponse<{ message: string; strategy: UserStrategy }>> => 
  api.post(`/strategies/users/${userId}/strategies/copy-public`, { strategyId, customName });
