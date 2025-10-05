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
