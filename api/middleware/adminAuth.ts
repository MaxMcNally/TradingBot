import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: 'USER' | 'ADMIN';
  };
}

export const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated (this should be set by the main auth middleware)
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Get user details from database to verify role
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Check if user has admin role
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin privileges required' 
      });
    }

    // User is authenticated and has admin role
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

export const requireAdminOrOwner = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    // Get user details from database to verify role
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // Check if user has admin role OR is the owner of the resource
    const resourceUserId = parseInt(req.params.userId || req.body.userId || '0');
    
    if (user.role !== 'ADMIN' && user.id !== resourceUserId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin privileges or resource ownership required' 
      });
    }

    // User is authenticated and has appropriate permissions
    next();
  } catch (error) {
    console.error('Admin or owner auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};
