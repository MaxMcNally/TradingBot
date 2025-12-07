// Dashboard component types and interfaces

export interface DashboardStats {
  totalPortfolioValue: number;
  totalReturn: number;
  totalReturnPercentage: number;
  activePositions: number;
  totalTrades: number;
  winRate: number;
}

export interface RecentTrade {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: string;
  profit?: number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentTrades: RecentTrade[];
  portfolioAllocation: Array<{
    symbol: string;
    percentage: number;
    value: number;
  }>;
}

// Trading session types
export interface TradingSessionConfig {
  mode: 'PAPER' | 'LIVE';
  initialCash: number;
  symbols: string[];
  strategy: string;
  strategyParameters: Record<string, any>;
}

export interface TradingSessionState {
  selectedStocks: string[];
  selectedStrategy: string;
  strategyParameters: Record<string, any>;
  activeSession: any | null;
}

// Component prop types
export interface StockPickerProps {
  selectedStocks: string[];
  onStocksChange: (stocks: string[]) => void;
  maxStocks?: number;
}

export interface StrategySelectorProps {
  selectedStrategy: string;
  onStrategyChange: (strategy: string) => void;
  strategyParameters: Record<string, any>;
  onParametersChange: (parameters: Record<string, any>) => void;
}

export interface TradingSessionControlsProps {
  userId: number;
  selectedStocks: string[];
  selectedStrategy: string;
  strategyParameters: Record<string, any>;
  onSessionStarted: (session: any) => void;
  onSessionStopped: () => void;
}

export interface TradingResultsProps {
  userId: number;
}
