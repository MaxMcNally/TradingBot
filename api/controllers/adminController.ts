import { Request, Response } from "express";
import { StrategyPerformance, StrategyPerformanceData, StrategyPerformanceSummary } from "../models/StrategyPerformance";
import { User } from "../models/User";
import { AuthenticatedRequest } from "../middleware/adminAuth";
import { SubscriptionTier, UpdateSubscriptionTierData } from "../models/SubscriptionTier";
import { db } from "../initDb";

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

export const getUserPerformanceData = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 100 } = req.query;
    
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({
        success: false,
        error: "Valid user ID is required"
      });
    }

    // Verify user exists
    const user = await User.findById(parseInt(userId));
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }

    // Get user's performance data
    const performances = await StrategyPerformance.findByUserId(parseInt(userId), parseInt(limit as string));

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        },
        performances: performances.map(p => StrategyPerformance.parsePerformanceData(p))
      }
    });
  } catch (error) {
    console.error("Error getting user performance data:", error);
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

export const getAllUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get all users with their subscription info
    const users = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT id, username, email, role, plan_tier, plan_status, 
                subscription_provider, subscription_renews_at, created_at 
         FROM users ORDER BY created_at DESC`,
        [],
        (err: any, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    // Get bot counts for each user
    const userIds = users.map(u => u.id);
    const botCounts = await new Promise<any[]>((resolve, reject) => {
      if (userIds.length === 0) {
        resolve([]);
        return;
      }
      db.all(
        `SELECT user_id, COUNT(*) as bot_count FROM user_strategies GROUP BY user_id`,
        [],
        (err: any, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    const botCountMap = new Map(botCounts.map(b => [b.user_id, b.bot_count]));

    const usersWithCounts = users.map(user => ({
      ...user,
      bot_count: botCountMap.get(user.id) || 0
    }));

    res.json({
      success: true,
      data: {
        users: usersWithCounts,
        total: users.length
      }
    });
  } catch (error) {
    console.error("Error getting all users:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// ========== Subscription Tier Management ==========

export const getSubscriptionTiers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tiers = await SubscriptionTier.findAll();
    
    res.json({
      success: true,
      data: {
        tiers
      }
    });
  } catch (error) {
    console.error("Error getting subscription tiers:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

export const getSubscriptionTierByName = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tier } = req.params;
    
    if (!tier) {
      return res.status(400).json({
        success: false,
        error: "Tier name is required"
      });
    }

    const tierData = await SubscriptionTier.findByTier(tier);
    
    if (!tierData) {
      return res.status(404).json({
        success: false,
        error: "Tier not found"
      });
    }

    // Get count of users on this tier
    const userCount = await new Promise<number>((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as count FROM users WHERE plan_tier = $1`,
        [tier.toUpperCase()],
        (err: any, row: any) => {
          if (err) reject(err);
          else resolve(row?.count || 0);
        }
      );
    });

    res.json({
      success: true,
      data: {
        tier: tierData,
        userCount
      }
    });
  } catch (error) {
    console.error("Error getting subscription tier:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

export const updateSubscriptionTier = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tier } = req.params;
    const updateData: UpdateSubscriptionTierData = req.body;
    
    if (!tier) {
      return res.status(400).json({
        success: false,
        error: "Tier name is required"
      });
    }

    // Validate the tier exists
    const existingTier = await SubscriptionTier.findByTier(tier);
    if (!existingTier) {
      return res.status(404).json({
        success: false,
        error: "Tier not found"
      });
    }

    // Validate limits if provided
    if (updateData.max_bots !== undefined && updateData.max_bots < -1) {
      return res.status(400).json({
        success: false,
        error: "max_bots must be -1 (unlimited) or a positive number"
      });
    }

    if (updateData.max_running_bots !== undefined && updateData.max_running_bots < -1) {
      return res.status(400).json({
        success: false,
        error: "max_running_bots must be -1 (unlimited) or a positive number"
      });
    }

    // Validate price if provided
    if (updateData.price_cents !== undefined && updateData.price_cents < 0) {
      return res.status(400).json({
        success: false,
        error: "price_cents cannot be negative"
      });
    }

    // Sync monthly_price with price_cents if only price_cents is provided
    if (updateData.price_cents !== undefined && updateData.monthly_price === undefined) {
      updateData.monthly_price = updateData.price_cents / 100;
    }

    // Sync price_cents with monthly_price if only monthly_price is provided
    if (updateData.monthly_price !== undefined && updateData.price_cents === undefined) {
      updateData.price_cents = Math.round(updateData.monthly_price * 100);
    }

    const updatedTier = await SubscriptionTier.update(tier, updateData);
    
    if (!updatedTier) {
      return res.status(500).json({
        success: false,
        error: "Failed to update tier"
      });
    }

    res.json({
      success: true,
      message: `Subscription tier '${tier}' updated successfully`,
      data: {
        tier: updatedTier
      }
    });
  } catch (error) {
    console.error("Error updating subscription tier:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

export const getSubscriptionStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get user counts by tier
    const tierCounts = await new Promise<any[]>((resolve, reject) => {
      db.all(
        `SELECT plan_tier, COUNT(*) as count FROM users GROUP BY plan_tier`,
        [],
        (err: any, rows: any[]) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    // Get all tiers with their limits
    const tiers = await SubscriptionTier.findAll();

    // Get total revenue (estimated from active paid subscriptions)
    const revenueData = await new Promise<any>((resolve, reject) => {
      db.get(
        `SELECT 
           SUM(CASE WHEN plan_tier = 'BASIC' THEN 999 
                    WHEN plan_tier = 'PREMIUM' THEN 2999 
                    WHEN plan_tier = 'ENTERPRISE' THEN 19999 
                    ELSE 0 END) as monthly_revenue_cents
         FROM users WHERE plan_status = 'ACTIVE' AND plan_tier != 'FREE'`,
        [],
        (err: any, row: any) => {
          if (err) reject(err);
          else resolve(row || { monthly_revenue_cents: 0 });
        }
      );
    });

    // Get total bots created
    const botStats = await new Promise<any>((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as total_bots FROM user_strategies`,
        [],
        (err: any, row: any) => {
          if (err) reject(err);
          else resolve(row || { total_bots: 0 });
        }
      );
    });

    // Get active trading sessions
    const sessionStats = await new Promise<any>((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as active_sessions FROM trading_sessions WHERE status = 'ACTIVE'`,
        [],
        (err: any, row: any) => {
          if (err) reject(err);
          else resolve(row || { active_sessions: 0 });
        }
      );
    });

    const tierCountMap = new Map(tierCounts.map(t => [t.plan_tier, t.count]));

    res.json({
      success: true,
      data: {
        tiers: tiers.map(tier => ({
          ...tier,
          userCount: tierCountMap.get(tier.tier) || 0
        })),
        summary: {
          totalUsers: tierCounts.reduce((sum, t) => sum + t.count, 0),
          paidUsers: tierCounts.filter(t => t.plan_tier !== 'FREE').reduce((sum, t) => sum + t.count, 0),
          freeUsers: tierCountMap.get('FREE') || 0,
          monthlyRevenueCents: revenueData.monthly_revenue_cents || 0,
          monthlyRevenue: (revenueData.monthly_revenue_cents || 0) / 100,
          totalBots: botStats.total_bots || 0,
          activeSessions: sessionStats.active_sessions || 0
        },
        tierBreakdown: tierCounts
      }
    });
  } catch (error) {
    console.error("Error getting subscription stats:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

export const updateUserSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { planTier, planStatus } = req.body;
    
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({
        success: false,
        error: "Valid user ID is required"
      });
    }

    if (!planTier) {
      return res.status(400).json({
        success: false,
        error: "Plan tier is required"
      });
    }

    const validTiers = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'];
    if (!validTiers.includes(planTier.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: "Invalid plan tier"
      });
    }

    const validStatuses = ['ACTIVE', 'CANCELED', 'PAST_DUE', 'TRIALING'];
    const status = planStatus ? planStatus.toUpperCase() : 'ACTIVE';
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid plan status"
      });
    }

    // Update the user's subscription
    await new Promise<void>((resolve, reject) => {
      db.run(
        `UPDATE users SET plan_tier = $1, plan_status = $2, updated_at = NOW() WHERE id = $3`,
        [planTier.toUpperCase(), status, parseInt(userId)],
        function(this: any, err: any) {
          if (err) reject(err);
          else if (this.changes === 0) reject(new Error('User not found'));
          else resolve();
        }
      );
    });

    // Get updated user
    const user = await User.findById(parseInt(userId));

    res.json({
      success: true,
      message: `User subscription updated to ${planTier}`,
      data: {
        user: {
          id: user?.id,
          username: user?.username,
          plan_tier: user?.plan_tier,
          plan_status: user?.plan_status
        }
      }
    });
  } catch (error: any) {
    console.error("Error updating user subscription:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
};
