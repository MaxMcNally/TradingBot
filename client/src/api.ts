import axios, { AxiosResponse } from "axios";

// Use environment-based API URL for production, localhost for development
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";

// Create axios instance with default config
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

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
    
    // Don't retry refresh token requests to avoid infinite loops
    if (originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      // If this is not a retry and we have a token, try to refresh it
      if (!originalRequest._retry && localStorage.getItem('authToken')) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;
        
        try {
          const response = await refreshToken();
          interface RefreshTokenResponse {
            token?: string;
            data?: { token?: string };
          }
          const refreshData = response.data as RefreshTokenResponse;
          const token: string | undefined = refreshData.token ?? refreshData.data?.token;
          
          // Update the stored token
          if (token) {
            localStorage.setItem('authToken', token);
          }
          
          // Process the queue
          failedQueue.forEach(({ resolve }) => resolve(token));
          failedQueue = [];
          
          // Retry the original request with the new token
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear local data and reject queued requests
          console.log('Token refresh failed, clearing local data');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          
          failedQueue.forEach(({ reject }) => reject(refreshError));
          failedQueue = [];
        } finally {
          isRefreshing = false;
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
  username?: string;
  email_verified?: number;
  two_factor_enabled?: number;
  role?: 'USER' | 'ADMIN';
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
  // Provider
  provider?: 'yahoo' | 'polygon' | 'polygon-flatfiles';
  // Common
  initialCapital?: number;
  sharesPerTrade?: number;
  // Mean Reversion
  window?: number;
  threshold?: number;
  // Moving Average Crossover
  fastWindow?: number;
  slowWindow?: number;
  maType?: 'SMA' | 'EMA';
  // Momentum
  rsiWindow?: number;
  rsiOverbought?: number;
  rsiOversold?: number;
  momentumWindow?: number;
  momentumThreshold?: number;
  // Bollinger Bands
  multiplier?: number;
  // Breakout
  lookbackWindow?: number;
  breakoutThreshold?: number;
  minVolumeRatio?: number;
  confirmationPeriod?: number;
  // Sentiment Analysis
  lookbackDays?: number;
  pollIntervalMinutes?: number;
  minArticles?: number;
  buyThreshold?: number;
  sellThreshold?: number;
  titleWeight?: number;
  recencyHalfLifeHours?: number;
  newsSource?: 'tiingo' | 'yahoo';
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

// Email verification API
export const requestEmailVerification = (): Promise<AxiosResponse<ApiResponse<{ verificationToken: string }>>> => 
  api.post('/auth/verify-email/request');

export const confirmEmailVerification = (token: string): Promise<AxiosResponse<ApiResponse>> => 
  api.post('/auth/verify-email/confirm', { token });

// 2FA API
export const setup2FA = (): Promise<AxiosResponse<ApiResponse<{ secret: string; qrCodeDataUrl: string }>>> => 
  api.post('/auth/2fa/setup');

export const enable2FA = (token: string): Promise<AxiosResponse<ApiResponse>> => 
  api.post('/auth/2fa/enable', { token });

export const disable2FA = (): Promise<AxiosResponse<ApiResponse>> => 
  api.post('/auth/2fa/disable');

export const verify2FAAfterLogin = (username: string, token: string): Promise<AxiosResponse<ApiResponse<AuthResponse>>> => 
  api.post('/auth/2fa/verify', { username, token });

// Password reset API
export const requestPasswordReset = (emailOrUsername: string): Promise<AxiosResponse<ApiResponse<{ resetToken: string }>>> => 
  api.post('/auth/password/reset/request', { emailOrUsername });

export const confirmPasswordReset = (token: string, newPassword: string): Promise<AxiosResponse<ApiResponse>> => 
  api.post('/auth/password/reset/confirm', { token, newPassword });

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
  api.get('/trading/strategies');

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

// Alpaca Integration API

export interface AlpacaConnectRequest {
  apiKey: string;
  apiSecret: string;
  isPaper?: boolean;
}

export interface AlpacaAccount {
  id: string;
  status: string;
  currency: string;
  buyingPower: string;
  portfolioValue: string;
  cash: string;
  equity?: string;
  tradingBlocked?: boolean;
  accountBlocked?: boolean;
}

export interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  qty: string;
  avg_entry_price: string;
  side: string;
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
}

export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at: string | null;
  symbol: string;
  qty: string;
  filled_qty: string;
  filled_avg_price: string | null;
  order_type: string;
  type: string;
  side: string;
  time_in_force: string;
  limit_price: string | null;
  stop_price: string | null;
  status: string;
}

export interface AlpacaOrderRequest {
  symbol: string;
  qty: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
  limit_price?: number;
  stop_price?: number;
}

export interface AlpacaStatusResponse {
  connected: boolean;
  tradingMode: 'paper' | 'live' | null;
  environment: string;
  account: AlpacaAccount | null;
  error?: string;
  maskedApiKey?: string;
}

export interface AlpacaConnectResponse {
  success: boolean;
  message: string;
  account: AlpacaAccount;
  tradingMode: 'paper' | 'live';
  environment: string;
}

export interface AlpacaClock {
  timestamp: string;
  is_open: boolean;
  next_open: string;
  next_close: string;
}

// Alpaca connection management
export const connectAlpaca = (data: AlpacaConnectRequest): Promise<AxiosResponse<AlpacaConnectResponse>> =>
  api.post('/alpaca/connect', data);

export const disconnectAlpaca = (): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
  api.post('/alpaca/disconnect');

export const getAlpacaStatus = (): Promise<AxiosResponse<AlpacaStatusResponse>> =>
  api.get('/alpaca/status');

// Alpaca account information
export const getAlpacaAccount = (): Promise<AxiosResponse<{ account: AlpacaAccount }>> =>
  api.get('/alpaca/account');

// Alpaca positions
export const getAlpacaPositions = (): Promise<AxiosResponse<{ positions: AlpacaPosition[] }>> =>
  api.get('/alpaca/positions');

export const closeAlpacaPosition = (symbol: string, qty?: number, percentage?: number): Promise<AxiosResponse<{ success: boolean; order: AlpacaOrder }>> =>
  api.delete(`/alpaca/positions/${symbol}`, { data: { qty, percentage } });

// Alpaca orders
export const getAlpacaOrders = (status?: 'open' | 'closed' | 'all', limit?: number): Promise<AxiosResponse<{ orders: AlpacaOrder[] }>> =>
  api.get('/alpaca/orders', { params: { status, limit } });

export const submitAlpacaOrder = (order: AlpacaOrderRequest): Promise<AxiosResponse<{ success: boolean; order: AlpacaOrder; tradingMode: 'paper' | 'live' }>> =>
  api.post('/alpaca/orders', order);

export const cancelAlpacaOrder = (orderId: string): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
  api.delete(`/alpaca/orders/${orderId}`);

// Market information
export const getAlpacaMarketClock = (): Promise<AxiosResponse<{ clock: AlpacaClock }>> =>
  api.get('/alpaca/clock');
