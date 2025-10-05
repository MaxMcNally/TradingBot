import {Request, Response } from "express";

import User from "../models/User.js";

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const user = await User.findOne({ where: { username, password } })



if (!user) return res.status(401).json({ message: "Invalid credentials" });
  return res.json({ message: "Logged in successfully", user: { id: user.id, username: user.username } });
};

export const logout = async (req: Request, res: Response) => {
  return res.json({ message: "Logged out successfully" });
};
