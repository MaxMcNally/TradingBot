import { db } from '../initDb';

export interface StrategyPerformanceData {
  id?: number;
  user_id: number;
  strategy_name: string;
  strategy_type: string;
  execution_type: 'BACKTEST' | 'LIVE_TRADING';
  session_id?: number; // For live trading sessions
  symbols: string; // JSON array of symbols
  start_date: string;
  end_date: string;
  initial_capital: number;
  final_capital: number;
  total_return: number; // Percentage
  total_return_dollar: number; // Dollar amount
  max_drawdown: number; // Percentage
  sharpe_ratio?: number;
  sortino_ratio?: number;
  win_rate: number; // Percentage
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  avg_win: number; // Dollar amount
  avg_loss: number; // Dollar amount
  profit_factor: number; // Total wins / total losses
  largest_win: number; // Dollar amount
  largest_loss: number; // Dollar amount
  avg_trade_duration: number; // Hours
  volatility: number; // Annualized volatility
  beta?: number; // Market correlation
  alpha?: number; // Risk-adjusted return
  config: string; // JSON string of strategy configuration
  trades_data: string; // JSON string of all trades
  portfolio_history: string; // JSON string of portfolio value over time
  created_at?: string;
  updated_at?: string;
}

export interface CreateStrategyPerformanceData {
  user_id: number;
  strategy_name: string;
  strategy_type: string;
  execution_type: 'BACKTEST' | 'LIVE_TRADING';
  session_id?: number;
  symbols: string[];
  start_date: string;
  end_date: string;
  initial_capital: number;
  final_capital: number;
  total_return: number;
  total_return_dollar: number;
  max_drawdown: number;
  sharpe_ratio?: number;
  sortino_ratio?: number;
  win_rate: number;
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  avg_win: number;
  avg_loss: number;
  profit_factor: number;
  largest_win: number;
  largest_loss: number;
  avg_trade_duration: number;
  volatility: number;
  beta?: number;
  alpha?: number;
  config: any;
  trades_data: any[];
  portfolio_history: any[];
}

export interface StrategyPerformanceSummary {
  strategy_name: string;
  strategy_type: string;
  total_executions: number;
  avg_return: number;
  best_return: number;
  worst_return: number;
  avg_max_drawdown: number;
  avg_win_rate: number;
  avg_sharpe_ratio: number;
  total_trades: number;
  success_rate: number; // Percentage of profitable executions
  last_execution: string;
}

export class StrategyPerformance {
  static async create(performanceData: CreateStrategyPerformanceData): Promise<StrategyPerformanceData> {
    return new Promise((resolve, reject) => {
      const {
        user_id, strategy_name, strategy_type, execution_type, session_id,
        symbols, start_date, end_date, initial_capital, final_capital,
        total_return, total_return_dollar, max_drawdown, sharpe_ratio, sortino_ratio,
        win_rate, total_trades, winning_trades, losing_trades, avg_win, avg_loss,
        profit_factor, largest_win, largest_loss, avg_trade_duration, volatility,
        beta, alpha, config, trades_data, portfolio_history
      } = performanceData;

      const symbolsJson = JSON.stringify(symbols);
      const configJson = JSON.stringify(config);
      const tradesDataJson = JSON.stringify(trades_data);
      const portfolioHistoryJson = JSON.stringify(portfolio_history);

      const query = `INSERT INTO strategy_performance (
          user_id, strategy_name, strategy_type, execution_type, session_id,
          symbols, start_date, end_date, initial_capital, final_capital,
          total_return, total_return_dollar, max_drawdown, sharpe_ratio, sortino_ratio,
          win_rate, total_trades, winning_trades, losing_trades, avg_win, avg_loss,
          profit_factor, largest_win, largest_loss, avg_trade_duration, volatility,
          beta, alpha, config, trades_data, portfolio_history
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
        ) RETURNING id`;

      const params = [
        user_id, strategy_name, strategy_type, execution_type, session_id,
        symbolsJson, start_date, end_date, initial_capital, final_capital,
        total_return, total_return_dollar, max_drawdown, sharpe_ratio, sortino_ratio,
        win_rate, total_trades, winning_trades, losing_trades, avg_win, avg_loss,
        profit_factor, largest_win, largest_loss, avg_trade_duration, volatility,
        beta, alpha, configJson, tradesDataJson, portfolioHistoryJson
      ];

      db.run(query, params, function(this: any, err: any) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: this.lastID,
            user_id, strategy_name, strategy_type, execution_type, session_id,
            symbols: symbolsJson, start_date, end_date, initial_capital, final_capital,
            total_return, total_return_dollar, max_drawdown, sharpe_ratio, sortino_ratio,
            win_rate, total_trades, winning_trades, losing_trades, avg_win, avg_loss,
            profit_factor, largest_win, largest_loss, avg_trade_duration, volatility,
            beta, alpha, config: configJson, trades_data: tradesDataJson, portfolio_history: portfolioHistoryJson,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });
    });
  }

  static async findById(id: number): Promise<StrategyPerformanceData | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM strategy_performance WHERE id = $1',
        [id],
        (err: any, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(row || null);
          }
        }
      );
    });
  }

  static async findByUserId(userId: number, limit: number = 100): Promise<StrategyPerformanceData[]> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM strategy_performance WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2';
      
      db.all(query, [userId, limit], (err: any, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  static async findByStrategyName(strategyName: string, limit: number = 100): Promise<StrategyPerformanceData[]> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM strategy_performance WHERE strategy_name = $1 ORDER BY created_at DESC LIMIT $2';
      
      db.all(query, [strategyName, limit], (err: any, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  static async findByStrategyType(strategyType: string, limit: number = 100): Promise<StrategyPerformanceData[]> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM strategy_performance WHERE strategy_type = $1 ORDER BY created_at DESC LIMIT $2';
      
      db.all(query, [strategyType, limit], (err: any, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  static async getStrategySummary(strategyName: string): Promise<StrategyPerformanceSummary | null> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          strategy_name,
          strategy_type,
          COUNT(*) as total_executions,
          AVG(total_return) as avg_return,
          MAX(total_return) as best_return,
          MIN(total_return) as worst_return,
          AVG(max_drawdown) as avg_max_drawdown,
          AVG(win_rate) as avg_win_rate,
          AVG(sharpe_ratio) as avg_sharpe_ratio,
          SUM(total_trades) as total_trades,
          (COUNT(CASE WHEN total_return > 0 THEN 1 END) * 100.0 / COUNT(*)) as success_rate,
          MAX(created_at) as last_execution
        FROM strategy_performance 
        WHERE strategy_name = $1
        GROUP BY strategy_name, strategy_type
      `;
      
      db.get(query, [strategyName], (err: any, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  static async getAllStrategySummaries(): Promise<StrategyPerformanceSummary[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          strategy_name,
          strategy_type,
          COUNT(*) as total_executions,
          AVG(total_return) as avg_return,
          MAX(total_return) as best_return,
          MIN(total_return) as worst_return,
          AVG(max_drawdown) as avg_max_drawdown,
          AVG(win_rate) as avg_win_rate,
          AVG(sharpe_ratio) as avg_sharpe_ratio,
          SUM(total_trades) as total_trades,
          (COUNT(CASE WHEN total_return > 0 THEN 1 END) * 100.0 / COUNT(*)) as success_rate,
          MAX(created_at) as last_execution
        FROM strategy_performance 
        GROUP BY strategy_name, strategy_type
        ORDER BY avg_return DESC
      `;
      
      db.all(query, [], (err: any, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  static async getTopPerformers(limit: number = 10): Promise<StrategyPerformanceData[]> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM strategy_performance ORDER BY total_return DESC LIMIT $1';
      
      db.all(query, [limit], (err: any, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  static async getRecentExecutions(limit: number = 50): Promise<StrategyPerformanceData[]> {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM strategy_performance ORDER BY created_at DESC LIMIT $1';
      
      db.all(query, [limit], (err: any, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  static async delete(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM strategy_performance WHERE id = $1',
        [id],
        function(this: any, err: any) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  // Helper method to parse JSON fields
  static parsePerformanceData(performance: StrategyPerformanceData): StrategyPerformanceData {
    try {
      const parsed = { ...performance };
      if (parsed.symbols) {
        parsed.symbols = JSON.parse(parsed.symbols as string);
      }
      if (parsed.config) {
        parsed.config = JSON.parse(parsed.config as string);
      }
      if (parsed.trades_data) {
        parsed.trades_data = JSON.parse(parsed.trades_data as string);
      }
      if (parsed.portfolio_history) {
        parsed.portfolio_history = JSON.parse(parsed.portfolio_history as string);
      }
      return parsed;
    } catch (error) {
      console.error('Error parsing strategy performance data:', error);
      return performance;
    }
  }
}

export default StrategyPerformance;
