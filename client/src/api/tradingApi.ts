import { AxiosResponse } from "axios";
import { api } from "../api";

// Trading-specific types
export interface UserTradingStats {
  userId: number;
  username: string;
  totalTrades: number;
  winningTrades: number;
  totalPnL: number;
  winRate: number;
  activeSessions: number;
  lastTradeDate?: string;
}

export interface UserPortfolioSummary {
  userId: number;
  username: string;
  currentValue: number;
  cash: number;
  totalPositions: number;
  mode: 'PAPER' | 'LIVE';
  lastUpdate: string;
}

export interface Trade {
  id: number;
  user_id: number;
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: string;
  strategy: string;
  mode: 'PAPER' | 'LIVE';
  pnl?: number;
  created_at: string;
}

export interface TradingSession {
  id: number;
  user_id: number;
  start_time: string;
  end_time?: string;
  mode: 'PAPER' | 'LIVE';
  initial_cash: number;
  final_cash?: number;
  total_trades: number;
  winning_trades: number;
  total_pnl?: number;
  status: 'ACTIVE' | 'COMPLETED' | 'STOPPED';
  created_at: string;
}

export interface PortfolioSnapshot {
  id: number;
  user_id: number;
  timestamp: string;
  total_value: number;
  cash: number;
  positions: string; // JSON string
  mode: 'PAPER' | 'LIVE';
  created_at: string;
}

export interface TradingStrategy {
  name: string;
  description: string;
  parameters: Record<string, any>;
  enabled: boolean;
  symbols: string[];
}

export interface TradingConfig {
  mode: 'PAPER' | 'LIVE';
  initialCash: number;
  symbols: string[];
  strategies: TradingStrategy[];
  dataProvider: {
    type: 'polygon' | 'yahoo' | 'twelve_data';
    apiKey?: string;
    rateLimit?: number;
  };
  riskManagement: {
    maxPositionSize: number;
    stopLoss: number;
    takeProfit: number;
    maxDailyLoss: number;
    maxDrawdown: number;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    saveToDatabase: boolean;
    consoleOutput: boolean;
    logTrades: boolean;
    logPortfolioSnapshots: boolean;
  };
}

export interface StartTradingSessionRequest {
  userId: number;
  mode: 'PAPER' | 'LIVE';
  initialCash: number;
  symbols: string[];
  strategy: string;
  strategyParameters: Record<string, any>;
  scheduledEndTime?: string; // ISO string for when session should automatically end
}

export interface StartTradingSessionResponse {
  success: boolean;
  sessionId?: number;
  message: string;
}

// Trading API functions
export const getUserTradingStats = (userId: number): Promise<AxiosResponse<UserTradingStats>> =>
  api.get(`/trading/users/${userId}/stats`);

export const getUserPortfolioSummary = (userId: number): Promise<AxiosResponse<UserPortfolioSummary>> =>
  api.get(`/trading/users/${userId}/portfolio`);

export const getUserRecentTrades = (userId: number, limit: number = 50): Promise<AxiosResponse<Trade[]>> =>
  api.get(`/trading/users/${userId}/trades?limit=${limit}`);

export const getUserTradingSessions = (userId: number, limit: number = 20): Promise<AxiosResponse<TradingSession[]>> =>
  api.get(`/trading/users/${userId}/sessions?limit=${limit}`);

export const getUserPortfolioHistory = (userId: number, limit: number = 100): Promise<AxiosResponse<PortfolioSnapshot[]>> =>
  api.get(`/trading/users/${userId}/portfolio-history?limit=${limit}`);

export const getActiveTradingSession = (userId: number): Promise<AxiosResponse<TradingSession>> =>
  api.get(`/trading/users/${userId}/active-session`);

export const getTradesBySession = (sessionId: number): Promise<AxiosResponse<Trade[]>> =>
  api.get(`/trading/sessions/${sessionId}/trades`);

// Trading session management
export const startTradingSession = (data: StartTradingSessionRequest): Promise<AxiosResponse<StartTradingSessionResponse>> =>
  api.post('/trading/sessions/start', data);

export const stopTradingSession = (sessionId: number): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
  api.post(`/trading/sessions/${sessionId}/stop`);

export const pauseTradingSession = (sessionId: number): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
  api.post(`/trading/sessions/${sessionId}/pause`);

export const resumeTradingSession = (sessionId: number): Promise<AxiosResponse<{ success: boolean; message: string }>> =>
  api.post(`/trading/sessions/${sessionId}/resume`);

// Strategy management
export const getAvailableStrategies = (): Promise<AxiosResponse<{ strategies: TradingStrategy[] }>> =>
  api.get('/trading/strategies');

export const getStrategyConfig = (strategyName: string): Promise<AxiosResponse<TradingStrategy>> =>
  api.get(`/trading/strategies/${strategyName}`);

// Real-time trading data (WebSocket connection)
export const connectToTradingWebSocket = (userId: number, onMessage: (data: any) => void): WebSocket => {
  const wsUrl = `ws://localhost:8001/ws/trading/${userId}`;
  const ws = new WebSocket(wsUrl);
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  ws.onclose = () => {
    console.log('WebSocket connection closed');
  };
  
  return ws;
};

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

export const calculatePnLColor = (pnl: number): string => {
  if (pnl > 0) return '#4caf50'; // Green
  if (pnl < 0) return '#f44336'; // Red
  return '#757575'; // Gray
};

export const getTradeActionColor = (action: 'BUY' | 'SELL'): string => {
  return action === 'BUY' ? '#4caf50' : '#f44336';
};

export const getSessionStatusColor = (status: 'ACTIVE' | 'COMPLETED' | 'STOPPED'): string => {
  switch (status) {
    case 'ACTIVE': return '#4caf50';
    case 'COMPLETED': return '#2196f3';
    case 'STOPPED': return '#f44336';
    default: return '#757575';
  }
};
