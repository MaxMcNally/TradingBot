import { Response } from "express";
import { StrategyPerformance } from "../models/StrategyPerformance";
import { AuthenticatedRequest } from "../middleware/auth";

export const getStrategyPerformanceOverview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { limit = 50, strategyType, executionType } = req.query;
    
    // Get all strategy summaries
    const summaries = await StrategyPerformance.getAllStrategySummaries();
    
    // Get recent executions
    const recentExecutions = await StrategyPerformance.getRecentExecutions(parseInt(limit as string));
    
    // Get top performers
    const topPerformers = await StrategyPerformance.getTopPerformers(10);
    
    // Filter by strategy type if specified
    let filteredSummaries = summaries;
    if (strategyType) {
      filteredSummaries = summaries.filter(s => s.strategy_type === strategyType);
    }
    
    // Filter recent executions by execution type if specified
    let filteredExecutions = recentExecutions;
    if (executionType) {
      filteredExecutions = recentExecutions.filter(e => e.execution_type === executionType);
    }

    res.json({
      success: true,
      data: {
        summaries: filteredSummaries,
        recentExecutions: filteredExecutions,
        topPerformers,
        totalStrategies: summaries.length,
        totalExecutions: recentExecutions.length
      }
    });
  } catch (error) {
    console.error("Error getting strategy performance overview:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

export const getStrategyPerformanceDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { strategyName } = req.params;
    const { limit = 100 } = req.query;
    
    if (!strategyName) {
      return res.status(400).json({
        success: false,
        error: "Strategy name is required"
      });
    }

    // Get strategy summary
    const summary = await StrategyPerformance.getStrategySummary(strategyName);
    
    // Get detailed performance records
    const performances = await StrategyPerformance.findByStrategyName(strategyName, parseInt(limit as string));

    if (!summary && performances.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Strategy not found"
      });
    }

    res.json({
      success: true,
      data: {
        summary,
        performances: performances.map(p => StrategyPerformance.parsePerformanceData(p))
      }
    });
  } catch (error) {
    console.error("Error getting strategy performance details:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

export const getStrategyPerformanceByStrategyId = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { strategyId } = req.params;
    const { limit = 100 } = req.query;
    
    if (!strategyId) {
      return res.status(400).json({
        success: false,
        error: "Strategy ID is required"
      });
    }

    const strategyIdNum = parseInt(strategyId);
    if (isNaN(strategyIdNum)) {
      return res.status(400).json({
        success: false,
        error: "Invalid strategy ID"
      });
    }

    // Get detailed performance records by strategy ID
    const performances = await StrategyPerformance.findByStrategyId(strategyIdNum, parseInt(limit as string));

    if (performances.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No performance data found for this strategy"
      });
    }

    res.json({
      success: true,
      data: {
        performances: performances.map(p => StrategyPerformance.parsePerformanceData(p))
      }
    });
  } catch (error) {
    console.error("Error getting strategy performance by ID:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

export const getStrategyPerformanceById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: "Valid performance ID is required"
      });
    }

    const performance = await StrategyPerformance.findById(parseInt(id));
    
    if (!performance) {
      return res.status(404).json({
        success: false,
        error: "Performance record not found"
      });
    }

    res.json({
      success: true,
      data: StrategyPerformance.parsePerformanceData(performance)
    });
  } catch (error) {
    console.error("Error getting strategy performance by ID:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

export const getPerformanceAnalytics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { timeframe = '30d', strategyType } = req.query;
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get all recent performances
    const recentPerformances = await StrategyPerformance.getRecentExecutions(1000);
    
    // Filter by date range and strategy type
    let filteredPerformances = recentPerformances.filter(p => {
      const createdDate = new Date(p.created_at!);
      const matchesDate = createdDate >= startDate;
      const matchesType = !strategyType || p.strategy_type === strategyType;
      return matchesDate && matchesType;
    });

    // Calculate analytics
    const analytics = {
      totalExecutions: filteredPerformances.length,
      totalStrategies: new Set(filteredPerformances.map(p => p.strategy_name)).size,
      avgReturn: filteredPerformances.reduce((sum, p) => sum + p.total_return, 0) / filteredPerformances.length || 0,
      bestReturn: Math.max(...filteredPerformances.map(p => p.total_return), 0),
      worstReturn: Math.min(...filteredPerformances.map(p => p.total_return), 0),
      avgWinRate: filteredPerformances.reduce((sum, p) => sum + p.win_rate, 0) / filteredPerformances.length || 0,
      avgMaxDrawdown: filteredPerformances.reduce((sum, p) => sum + p.max_drawdown, 0) / filteredPerformances.length || 0,
      totalTrades: filteredPerformances.reduce((sum, p) => sum + p.total_trades, 0),
      profitableExecutions: filteredPerformances.filter(p => p.total_return > 0).length,
      successRate: filteredPerformances.length > 0 ? 
        (filteredPerformances.filter(p => p.total_return > 0).length / filteredPerformances.length) * 100 : 0
    };

    // Strategy type breakdown
    const strategyBreakdown = filteredPerformances.reduce((acc, p) => {
      if (!acc[p.strategy_type]) {
        acc[p.strategy_type] = {
          count: 0,
          avgReturn: 0,
          totalReturn: 0
        };
      }
      acc[p.strategy_type].count++;
      acc[p.strategy_type].totalReturn += p.total_return;
      acc[p.strategy_type].avgReturn = acc[p.strategy_type].totalReturn / acc[p.strategy_type].count;
      return acc;
    }, {} as Record<string, { count: number; avgReturn: number; totalReturn: number }>);

    res.json({
      success: true,
      data: {
        timeframe,
        analytics,
        strategyBreakdown,
        recentTrends: filteredPerformances.slice(0, 20).map(p => ({
          date: p.created_at,
          strategy: p.strategy_name,
          return: p.total_return,
          winRate: p.win_rate
        }))
      }
    });
  } catch (error) {
    console.error("Error getting performance analytics:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

export const deletePerformanceRecord = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: "Valid performance ID is required"
      });
    }

    const deleted = await StrategyPerformance.delete(parseInt(id));
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "Performance record not found"
      });
    }

    res.json({
      success: true,
      message: "Performance record deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting performance record:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

