// Backtesting component types and interfaces

export interface SymbolOption {
  symbol: string;
  name: string;
  exchange: string;
  type?: string;
  market?: string;
}

export interface BacktestFormData {
  strategy: string;
  symbols: string[];
  startDate: string;
  endDate: string;
  // Common parameters
  initialCapital: number;
  sharesPerTrade: number;
  // Mean Reversion parameters
  window: number;
  threshold: number;
  // Moving Average Crossover parameters
  fastWindow: number;
  slowWindow: number;
  maType: 'SMA' | 'EMA';
  // Momentum parameters
  rsiWindow: number;
  rsiOverbought: number;
  rsiOversold: number;
  momentumWindow: number;
  momentumThreshold: number;
  // Bollinger Bands parameters
  multiplier: number;
  // Breakout parameters
  lookbackWindow: number;
  breakoutThreshold: number;
  minVolumeRatio: number;
  confirmationPeriod: number;
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
  success: boolean;
  data: {
    results: BacktestResult[];
  };
}

export interface Strategy {
  name: string;
  description?: string;
  category?: string;
  parameters?: Record<string, StrategyParameter>;
}

export interface StrategyParameter {
  type: 'number' | 'select';
  description: string;
  default: any;
  min?: number;
  max?: number;
  options?: string[];
}

export interface SearchResponse {
  success: boolean;
  data: {
    symbols: SymbolOption[];
    query: string;
    source: 'yahoo-finance' | 'static';
    count?: number;
  };
}

export type SearchSource = 'yahoo-finance' | 'static';
