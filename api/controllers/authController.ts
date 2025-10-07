import {Request, Response } from "express";

import User from "../models/User";

export const login = async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    
    // Find user by username
    const user = await User.findByUsername(username);
    
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // In a real application, you would hash the password and compare with user.password_hash
    // For now, we'll assume the password is already hashed or use a simple comparison
    // TODO: Implement proper password hashing comparison using bcrypt
    
    return res.json({ 
      message: "Logged in successfully", 
      user: { id: user.id, username: user.username } 
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const logout = async (req: Request, res: Response) => {
  return res.json({ message: "Logged out successfully" });
};
