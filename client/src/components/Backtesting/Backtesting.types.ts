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
  success: boolean;
  data: {
    results: BacktestResult[];
  };
}

export interface Strategy {
  name: string;
  description?: string;
  parameters?: Record<string, any>;
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
