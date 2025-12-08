import { db } from '../initDb';

/**
 * Represents a condition node in the custom strategy tree
 * This can be an indicator condition or a logical operator
 */
export interface ConditionNode {
  type: 'indicator' | 'and' | 'or' | 'not';
  // For indicator conditions
  indicator?: {
    type: 'sma' | 'ema' | 'rsi' | 'macd' | 'bollingerBands' | 'vwap';
    params: Record<string, any>; // Indicator-specific parameters
    condition: string; // e.g., 'above', 'below', 'crossesAbove', etc.
    value?: number | string; // Threshold value or indicator reference
  };
  // For logical operators
  children?: ConditionNode[];
}

export interface CustomStrategyData {
  id?: number;
  user_id: number;
  name: string;
  description?: string;
  buy_conditions: string; // JSON string of ConditionNode
  sell_conditions: string; // JSON string of ConditionNode
  is_active: boolean;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCustomStrategyData {
  user_id: number;
  name: string;
  description?: string;
  buy_conditions: ConditionNode | ConditionNode[];
  sell_conditions: ConditionNode | ConditionNode[];
  is_public?: boolean;
}

export interface UpdateCustomStrategyData {
  name?: string;
  description?: string;
  buy_conditions?: ConditionNode | ConditionNode[];
  sell_conditions?: ConditionNode | ConditionNode[];
  is_active?: boolean;
  is_public?: boolean;
}

export class CustomStrategy {
  static async create(strategyData: CreateCustomStrategyData): Promise<CustomStrategyData> {
    return new Promise((resolve, reject) => {
      const { user_id, name, description, buy_conditions, sell_conditions, is_public } = strategyData;
      
      const buyConditionsJson = JSON.stringify(buy_conditions);
      const sellConditionsJson = JSON.stringify(sell_conditions);

      db.run(
        'INSERT INTO custom_strategies (user_id, name, description, buy_conditions, sell_conditions, is_public) VALUES ($1, $2, $3, $4, $5, $6)',
        [user_id, name, description || null, buyConditionsJson, sellConditionsJson, is_public || false],
        function(this: any, err: any) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              user_id,
              name,
              description,
              buy_conditions: buyConditionsJson,
              sell_conditions: sellConditionsJson,
              is_active: true,
              is_public: is_public || false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
      );
    });
  }

  static async findById(id: number): Promise<CustomStrategyData | null> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM custom_strategies WHERE id = $1', [id], (err: any, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  static async findByUserId(userId: number, includeInactive: boolean = false): Promise<CustomStrategyData[]> {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM custom_strategies WHERE user_id = $1';
      const params: any[] = [userId];
      
      if (!includeInactive) {
        query += ' AND is_active = TRUE';
      }
      
      query += ' ORDER BY created_at DESC';
      
      db.all(query, params, (err: any, rows?: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  static async findByName(userId: number, name: string): Promise<CustomStrategyData | null> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM custom_strategies WHERE user_id = $1 AND name = $2', [userId, name], (err: any, row: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  static async update(id: number, updateData: UpdateCustomStrategyData): Promise<CustomStrategyData | null> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: any[] = [];
      
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          const paramIndex = values.length + 1;
          if (key === 'buy_conditions' || key === 'sell_conditions') {
            fields.push(`${key} = $${paramIndex}`);
            values.push(JSON.stringify(value));
          } else {
            fields.push(`${key} = $${paramIndex}`);
            values.push(value);
          }
        }
      });
      
      if (fields.length === 0) {
        return resolve(null);
      }
      
      fields.push(`updated_at = NOW()`);
      const idParamIndex = values.length + 1;
      values.push(id);
      
      const query = `UPDATE custom_strategies SET ${fields.join(', ')} WHERE id = $${idParamIndex}`;
      
      db.run(query, values, function(this: any, err: any) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          resolve(null);
        } else {
          // Return the updated strategy
          CustomStrategy.findById(id).then(resolve).catch(reject);
        }
      });
    });
  }

  static async delete(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM custom_strategies WHERE id = $1', [id], function(this: any, err: any) {
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
        'UPDATE custom_strategies SET is_active = FALSE, updated_at = NOW() WHERE id = $1',
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

  static async activate(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE custom_strategies SET is_active = TRUE, updated_at = NOW() WHERE id = $1',
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
  static parseStrategyData(strategy: CustomStrategyData): Omit<CustomStrategyData, 'buy_conditions' | 'sell_conditions'> & {
    buy_conditions: ConditionNode | ConditionNode[];
    sell_conditions: ConditionNode | ConditionNode[];
  } {
    try {
      const buyConditions = typeof strategy.buy_conditions === 'string' 
        ? JSON.parse(strategy.buy_conditions) as ConditionNode | ConditionNode[]
        : strategy.buy_conditions as ConditionNode | ConditionNode[];
      
      const sellConditions = typeof strategy.sell_conditions === 'string'
        ? JSON.parse(strategy.sell_conditions) as ConditionNode | ConditionNode[]
        : strategy.sell_conditions as ConditionNode | ConditionNode[];

      return {
        ...strategy,
        buy_conditions: buyConditions,
        sell_conditions: sellConditions
      };
    } catch (error) {
      console.error('Error parsing custom strategy data:', error);
      throw error;
    }
  }
}

export default CustomStrategy;

