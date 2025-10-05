import { Request, Response } from "express";
import User from "../models/User";
import Settings, { UserWithSettings } from "../models/Settings";

export const saveSettings = async (req: Request, res: Response) => {
  try {
    const { username, settings } = req.body;
    const user = await User.findByUsername(username);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    const [userSettings] = await Settings.upsert({ UserId: user.id!, ...settings });
    return res.json({ message: "Settings saved successfully", settings: userSettings });
  } catch (error) {
    console.error("Save settings error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getSettings = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const user = await UserWithSettings.findOneWithSettings({ username });
    if (!user || !user.Settings) return res.status(404).json({ message: "Settings not found" });
    return res.json({ settings: user.Settings });
  } catch (error) {
    console.error("Get settings error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
