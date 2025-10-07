import { Request, RequestHandler } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    email?: string;
    email_verified?: number;
    two_factor_enabled?: number;
  };
}

export const authenticateToken: RequestHandler = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(403).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: Error | null, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    (req as AuthenticatedRequest).user = user;
    next();
  });
};

export const generateToken = (user: { id: number; username: string; email?: string; email_verified?: number; two_factor_enabled?: number }) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      email: user.email,
      email_verified: user.email_verified,
      two_factor_enabled: user.two_factor_enabled,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};
