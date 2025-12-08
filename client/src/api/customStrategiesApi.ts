import { AxiosResponse } from "axios";
import { api, ApiResponse } from "../api";

/**
 * ConditionNode represents a node in the custom strategy condition tree
 */
export interface ConditionNode {
  type: 'indicator' | 'and' | 'or' | 'not';
  indicator?: {
    type: 'sma' | 'ema' | 'rsi' | 'macd' | 'bollingerBands' | 'vwap';
    params: Record<string, any>;
    condition: string;
    value?: number | string;
    refIndicator?: {
      type: 'sma' | 'ema' | 'rsi' | 'macd' | 'bollingerBands' | 'vwap';
      params: Record<string, any>;
    };
  };
  children?: ConditionNode[];
}

/**
 * CustomStrategy represents a user-created custom trading strategy
 */
export interface CustomStrategy {
  id: number;
  user_id: number;
  name: string;
  description?: string;
  buy_conditions: ConditionNode | ConditionNode[];
  sell_conditions: ConditionNode | ConditionNode[];
  is_active: boolean;
  is_public?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomStrategyData {
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

export interface TestCustomStrategyRequest {
  buy_conditions: ConditionNode | ConditionNode[];
  sell_conditions: ConditionNode | ConditionNode[];
}

export interface TestCustomStrategyResponse {
  success: boolean;
  signals: Array<{
    timestamp: string;
    signal: 'BUY' | 'SELL' | null;
  }>;
}

export interface ValidateCustomStrategyRequest {
  buy_conditions: ConditionNode | ConditionNode[];
  sell_conditions: ConditionNode | ConditionNode[];
}

export interface ValidateCustomStrategyResponse {
  success: boolean;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// Get all custom strategies for the authenticated user
export const getCustomStrategies = (includeInactive: boolean = false): Promise<AxiosResponse<ApiResponse<CustomStrategy[]>>> =>
  api.get(`/custom-strategies?includeInactive=${includeInactive}`);

// Get a specific custom strategy by ID
export const getCustomStrategyById = (strategyId: number): Promise<AxiosResponse<ApiResponse<CustomStrategy>>> =>
  api.get(`/custom-strategies/${strategyId}`);

// Create a new custom strategy
export const createCustomStrategy = (data: CreateCustomStrategyData): Promise<AxiosResponse<ApiResponse<CustomStrategy>>> =>
  api.post('/custom-strategies', data);

// Update a custom strategy
export const updateCustomStrategy = (strategyId: number, data: UpdateCustomStrategyData): Promise<AxiosResponse<ApiResponse<CustomStrategy>>> =>
  api.put(`/custom-strategies/${strategyId}`, data);

// Delete a custom strategy
export const deleteCustomStrategy = (strategyId: number): Promise<AxiosResponse<ApiResponse>> =>
  api.delete(`/custom-strategies/${strategyId}`);

// Validate a custom strategy
export const validateCustomStrategy = (data: ValidateCustomStrategyRequest): Promise<AxiosResponse<ApiResponse<ValidateCustomStrategyResponse>>> =>
  api.post('/custom-strategies/validate', data);

// Test a custom strategy with sample data
export const testCustomStrategy = (data: TestCustomStrategyRequest): Promise<AxiosResponse<ApiResponse<TestCustomStrategyResponse>>> =>
  api.post('/custom-strategies/test', data);

