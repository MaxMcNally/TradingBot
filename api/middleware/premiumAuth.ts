import { RequestHandler } from "express";
import { AuthenticatedRequest } from "./auth";
import { User } from "../models/User";

/**
 * Middleware to require Premium or Enterprise tier subscription
 */
export const requirePremium: RequestHandler = async (req, res, next) => {
  const authReq = req as AuthenticatedRequest;
  const userId = authReq.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const planTier = user.plan_tier;
    
    if (planTier !== 'PREMIUM' && planTier !== 'ENTERPRISE') {
      return res.status(403).json({ 
        error: "This feature requires Premium or Enterprise subscription",
        required_tier: "PREMIUM",
        current_tier: planTier
      });
    }

    next();
  } catch (error) {
    console.error("Error checking premium status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

