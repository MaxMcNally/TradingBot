import { Response } from "express";
import { StrategyPerformance } from "../models/StrategyPerformance";
import { User } from "../models/User";
import { AuthenticatedRequest } from "../middleware/adminAuth";

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


export const getAllUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // This would require a method to get all users from the User model
    // For now, we'll return a placeholder response
    res.json({
      success: true,
      data: {
        message: "User listing functionality to be implemented",
        note: "This endpoint will return all users with their performance summaries"
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
