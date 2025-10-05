import { 
  UserTradingStats, 
  UserPortfolioSummary, 
  Trade, 
  TradingSession, 
  PortfolioSnapshot,
  StartTradingSessionRequest,
  StartTradingSessionResponse
} from '../../api/tradingApi';

export interface UseTradingStatsReturn {
  stats: UserTradingStats | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UsePortfolioSummaryReturn {
  portfolio: UserPortfolioSummary | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseTradesReturn {
  trades: Trade[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseTradingSessionsReturn {
  sessions: TradingSession[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UsePortfolioHistoryReturn {
  history: PortfolioSnapshot[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseTradingSessionManagementReturn {
  startSession: (data: StartTradingSessionRequest) => Promise<StartTradingSessionResponse>;
  stopSession: (sessionId: number) => Promise<void>;
  pauseSession: (sessionId: number) => Promise<void>;
  resumeSession: (sessionId: number) => Promise<void>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}
