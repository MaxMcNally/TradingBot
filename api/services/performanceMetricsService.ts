import { StrategyPerformance, CreateStrategyPerformanceData } from '../models/StrategyPerformance';

export interface TradeData {
  date: number;
  symbol: string;
  action: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  pnl: number;
}

export interface PortfolioSnapshot {
  timestamp: string;
  totalValue: number;
  cash: number;
  positions: Record<string, any>;
}

export interface BacktestMetrics {
  trades: TradeData[];
  portfolioHistory: PortfolioSnapshot[];
  initialCapital: number;
  finalCapital: number;
  startDate: string;
  endDate: string;
  symbols: string[];
  strategyName: string;
  strategyType: string;
  config: any;
}

export interface LiveTradingMetrics {
  trades: TradeData[];
  portfolioHistory: PortfolioSnapshot[];
  initialCapital: number;
  finalCapital: number;
  startDate: string;
  endDate: string;
  symbols: string[];
  strategyName: string;
  strategyType: string;
  config: any;
  sessionId?: number;
}

export class PerformanceMetricsService {
  /**
   * Calculate comprehensive performance metrics from trade and portfolio data
   */
  static calculateMetrics(metrics: BacktestMetrics | LiveTradingMetrics): CreateStrategyPerformanceData {
    const { trades, portfolioHistory, initialCapital, finalCapital, startDate, endDate, symbols, strategyName, strategyType, config } = metrics;
    const sessionId = 'sessionId' in metrics ? metrics.sessionId : undefined;

    // Basic calculations
    const totalReturn = (finalCapital - initialCapital) / initialCapital;
    const totalReturnDollar = finalCapital - initialCapital;

    // Trade analysis
    const sellTrades = trades.filter(t => t.action === 'SELL');
    const totalTrades = sellTrades.length;
    const winningTrades = sellTrades.filter(t => t.pnl > 0);
    const losingTrades = sellTrades.filter(t => t.pnl < 0);
    const winningTradesCount = winningTrades.length;
    const losingTradesCount = losingTrades.length;
    const winRate = totalTrades > 0 ? (winningTradesCount / totalTrades) * 100 : 0;

    // P&L analysis
    const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const avgWin = winningTradesCount > 0 ? totalWins / winningTradesCount : 0;
    const avgLoss = losingTradesCount > 0 ? totalLosses / losingTradesCount : 0;
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

    // Largest win/loss
    const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnl)) : 0;
    const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnl)) : 0;

    // Trade duration analysis
    const tradeDurations: number[] = [];
    const buyTrades = trades.filter(t => t.action === 'BUY');
    
    for (const sellTrade of sellTrades) {
      const correspondingBuy = buyTrades
        .filter(b => b.symbol === sellTrade.symbol && b.date < sellTrade.date)
        .sort((a, b) => b.date - a.date)[0]; // Most recent buy
      
      if (correspondingBuy) {
        const durationHours = (sellTrade.date - correspondingBuy.date) / (1000 * 60 * 60);
        tradeDurations.push(durationHours);
      }
    }
    
    const avgTradeDuration = tradeDurations.length > 0 ? 
      tradeDurations.reduce((sum, d) => sum + d, 0) / tradeDurations.length : 0;
    
    // Ensure avgTradeDuration is always a valid number
    const finalAvgTradeDuration = Number.isFinite(avgTradeDuration) ? avgTradeDuration : 0;

    // Drawdown calculation
    const maxDrawdown = this.calculateMaxDrawdown(portfolioHistory, initialCapital);

    // Volatility calculation
    const volatility = this.calculateVolatility(portfolioHistory);

    // Risk-adjusted metrics (simplified calculations)
    const sharpeRatio = this.calculateSharpeRatio(totalReturn, volatility);
    const sortinoRatio = this.calculateSortinoRatio(totalReturn, losingTrades);

    return {
      user_id: 1, // This should be passed from the calling context
      strategy_name: strategyName,
      strategy_type: strategyType,
      execution_type: sessionId ? 'LIVE_TRADING' : 'BACKTEST',
      session_id: sessionId,
      symbols,
      start_date: startDate,
      end_date: endDate,
      initial_capital: initialCapital,
      final_capital: finalCapital,
      total_return: totalReturn,
      total_return_dollar: totalReturnDollar,
      max_drawdown: maxDrawdown,
      sharpe_ratio: sharpeRatio,
      sortino_ratio: sortinoRatio,
      win_rate: winRate,
      total_trades: totalTrades,
      winning_trades: winningTradesCount,
      losing_trades: losingTradesCount,
      avg_win: avgWin,
      avg_loss: avgLoss,
      profit_factor: profitFactor,
      largest_win: largestWin,
      largest_loss: largestLoss,
      avg_trade_duration: finalAvgTradeDuration,
      volatility: volatility,
      config,
      trades_data: trades,
      portfolio_history: portfolioHistory
    };
  }

  /**
   * Calculate maximum drawdown from portfolio history
   */
  private static calculateMaxDrawdown(portfolioHistory: PortfolioSnapshot[], initialCapital: number): number {
    if (portfolioHistory.length === 0) return 0;

    let peak = initialCapital;
    let maxDrawdown = 0;

    for (const snapshot of portfolioHistory) {
      if (snapshot.totalValue > peak) {
        peak = snapshot.totalValue;
      }
      const drawdown = (peak - snapshot.totalValue) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  /**
   * Calculate annualized volatility from portfolio history
   */
  private static calculateVolatility(portfolioHistory: PortfolioSnapshot[]): number {
    if (portfolioHistory.length < 2) return 0;

    const returns: number[] = [];
    for (let i = 1; i < portfolioHistory.length; i++) {
      const prevValue = portfolioHistory[i - 1].totalValue;
      const currValue = portfolioHistory[i].totalValue;
      if (prevValue > 0) {
        returns.push((currValue - prevValue) / prevValue);
      }
    }

    if (returns.length === 0) return 0;

    // Calculate mean return
    const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

    // Calculate variance
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;

    // Annualize volatility (assuming daily data)
    return Math.sqrt(variance) * Math.sqrt(252);
  }

  /**
   * Calculate Sharpe ratio (simplified)
   */
  private static calculateSharpeRatio(totalReturn: number, volatility: number): number {
    if (volatility === 0) return 0;
    const riskFreeRate = 0.02; // Assume 2% risk-free rate
    return (totalReturn - riskFreeRate) / volatility;
  }

  /**
   * Calculate Sortino ratio (simplified)
   */
  private static calculateSortinoRatio(totalReturn: number, losingTrades: TradeData[]): number {
    if (losingTrades.length === 0) return totalReturn > 0 ? Infinity : 0;
    
    const downsideReturns = losingTrades.map(t => t.pnl / 10000); // Normalize by initial capital
    const downsideVariance = downsideReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / downsideReturns.length;
    const downsideDeviation = Math.sqrt(downsideVariance);
    
    if (downsideDeviation === 0) return totalReturn > 0 ? Infinity : 0;
    
    const riskFreeRate = 0.02;
    return (totalReturn - riskFreeRate) / downsideDeviation;
  }

  /**
   * Save performance metrics to database
   */
  static async savePerformanceMetrics(metrics: BacktestMetrics | LiveTradingMetrics, userId: number): Promise<void> {
    try {
      const performanceData = this.calculateMetrics(metrics);
      performanceData.user_id = userId;
      
      await StrategyPerformance.create(performanceData);
      console.log(`Performance metrics saved for strategy: ${metrics.strategyName}`);
    } catch (error) {
      console.error('Error saving performance metrics:', error);
      throw error;
    }
  }

  /**
   * Convert backtest results to performance metrics format
   */
  static convertBacktestResults(
    results: any,
    strategyName: string,
    strategyType: string,
    config: any,
    startDate: string,
    endDate: string,
    symbols: string[],
    initialCapital: number
  ): BacktestMetrics {
    // Extract and process trades from results
    const rawTrades = results.trades || [];
    const trades: TradeData[] = [];
    
    // Group trades by symbol and calculate P&L
    const tradesBySymbol: { [symbol: string]: any[] } = {};
    rawTrades.forEach((trade: any) => {
      if (!tradesBySymbol[trade.symbol]) {
        tradesBySymbol[trade.symbol] = [];
      }
      tradesBySymbol[trade.symbol].push(trade);
    });
    
    // Calculate P&L for each symbol's trades
    Object.keys(tradesBySymbol).forEach(symbol => {
      const symbolTrades = tradesBySymbol[symbol].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      let position = 0;
      let avgCost = 0;
      
      symbolTrades.forEach((trade: any) => {
        const tradeDate = new Date(trade.date).getTime();
        
        if (trade.action === 'BUY') {
          const newPosition = position + trade.shares;
          const newCost = (position * avgCost) + (trade.shares * trade.price);
          avgCost = newPosition > 0 ? newCost / newPosition : 0;
          position = newPosition;
          
          trades.push({
            date: tradeDate,
            symbol: trade.symbol,
            action: trade.action,
            price: trade.price,
            quantity: trade.shares,
            pnl: 0 // No P&L on buy
          });
        } else if (trade.action === 'SELL') {
          const pnl = (trade.price - avgCost) * trade.shares;
          position -= trade.shares;
          
          trades.push({
            date: tradeDate,
            symbol: trade.symbol,
            action: trade.action,
            price: trade.price,
            quantity: trade.shares,
            pnl: pnl
          });
        }
      });
    });
    
    // Create portfolio history from trades and results
    const portfolioHistory: PortfolioSnapshot[] = [];
    
    // If we have portfolio snapshots in results, use them
    if (results.portfolioHistory) {
      // Convert strategy portfolio history format to service format
      portfolioHistory.push(...results.portfolioHistory.map((snapshot: any) => ({
        timestamp: snapshot.date,
        totalValue: snapshot.portfolioValue,
        cash: snapshot.cash,
        positions: snapshot.shares > 0 ? { [symbols[0]]: { shares: snapshot.shares, price: snapshot.price } } : {}
      })));
    } else {
      // Otherwise, create a simple portfolio history
      portfolioHistory.push({
        timestamp: startDate,
        totalValue: initialCapital,
        cash: initialCapital,
        positions: {}
      });
      
      if (results.finalPortfolioValue) {
        portfolioHistory.push({
          timestamp: endDate,
          totalValue: results.finalPortfolioValue,
          cash: results.finalPortfolioValue,
          positions: {}
        });
      }
    }

    return {
      trades,
      portfolioHistory,
      initialCapital,
      finalCapital: results.finalPortfolioValue || initialCapital,
      startDate,
      endDate,
      symbols,
      strategyName,
      strategyType,
      config
    };
  }

  /**
   * Convert live trading session data to performance metrics format
   */
  static convertLiveTradingResults(
    sessionData: any,
    trades: TradeData[],
    portfolioHistory: PortfolioSnapshot[],
    strategyName: string,
    strategyType: string,
    config: any,
    symbols: string[]
  ): LiveTradingMetrics {
    return {
      trades,
      portfolioHistory,
      initialCapital: sessionData.initial_cash,
      finalCapital: sessionData.final_cash || sessionData.initial_cash,
      startDate: sessionData.start_time,
      endDate: sessionData.end_time || new Date().toISOString(),
      symbols,
      strategyName,
      strategyType,
      config,
      sessionId: sessionData.id
    };
  }
}
