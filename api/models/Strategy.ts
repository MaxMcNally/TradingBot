import { db } from '../initDb';

export interface StrategyData {
  id?: number;
  user_id: number;
  name: string;
  description?: string;
  strategy_type: string;
  config: string; // JSON string of strategy configuration
  backtest_results?: string; // JSON string of backtest results
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateStrategyData {
  user_id: number;
  name: string;
  description?: string;
  strategy_type: string;
  config: any; // Object that will be stringified
  backtest_results?: any; // Object that will be stringified
}

export interface UpdateStrategyData {
  name?: string;
  description?: string;
  strategy_type?: string;
  config?: any; // Object that will be stringified
  backtest_results?: any; // Object that will be stringified
  is_active?: boolean;
}

export class Strategy {
  static async create(strategyData: CreateStrategyData): Promise<StrategyData> {
    return new Promise((resolve, reject) => {
      const { user_id, name, description, strategy_type, config, backtest_results } = strategyData;
      
      const configJson = typeof config === 'string' ? config : JSON.stringify(config);
      const backtestResultsJson = backtest_results ? 
        (typeof backtest_results === 'string' ? backtest_results : JSON.stringify(backtest_results)) : 
        null;

      db.run(
        'INSERT INTO user_strategies (user_id, name, description, strategy_type, config, backtest_results) VALUES (?, ?, ?, ?, ?, ?)',
        [user_id, name, description, strategy_type, configJson, backtestResultsJson],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              user_id,
              name,
              description,
              strategy_type,
              config: configJson,
              backtest_results: backtestResultsJson || undefined,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      );
    });
  }

  static async findById(id: number): Promise<StrategyData | null> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM user_strategies WHERE id = ?', [id], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  static async findByUserId(userId: number, includeInactive: boolean = false): Promise<StrategyData[]> {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM user_strategies WHERE user_id = ?';
      const params: any[] = [userId];
      
      if (!includeInactive) {
        query += ' AND is_active = 1';
      }
      
      query += ' ORDER BY created_at DESC';
      
      db.all(query, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  static async findByName(userId: number, name: string): Promise<StrategyData | null> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM user_strategies WHERE user_id = ? AND name = ?', [userId, name], (err, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  static async update(id: number, updateData: UpdateStrategyData): Promise<StrategyData | null> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: any[] = [];
      
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'config' || key === 'backtest_results') {
            fields.push(`${key} = ?`);
            values.push(typeof value === 'string' ? value : JSON.stringify(value));
          } else {
            fields.push(`${key} = ?`);
            values.push(value);
          }
        }
      });
      
      if (fields.length === 0) {
        return resolve(null);
      }
      
      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      const query = `UPDATE user_strategies SET ${fields.join(', ')} WHERE id = ?`;
      
      db.run(query, values, function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          resolve(null);
        } else {
          // Return the updated strategy
          Strategy.findById(id).then(resolve).catch(reject);
        }
      });
    });
  }

  static async delete(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM user_strategies WHERE id = ?', [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  static async deactivate(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE user_strategies SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  static async activate(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE user_strategies SET is_active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id],
        function(err) {
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
  static parseStrategyData(strategy: StrategyData): StrategyData {
    try {
      const parsed = { ...strategy };
      if (parsed.config) {
        parsed.config = JSON.parse(parsed.config as string);
      }
      if (parsed.backtest_results) {
        parsed.backtest_results = JSON.parse(parsed.backtest_results as string);
      }
      return parsed;
    } catch (error) {
      console.error('Error parsing strategy data:', error);
      return strategy;
    }
  }
}

export default Strategy;
