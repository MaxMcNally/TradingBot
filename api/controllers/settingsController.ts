import User from "../models/User.js";
import Settings from "../models/Settings.js";

export const saveSettings = async (req, res) => {
  const { username, settings } = req.body;
  const user = await User.findOne({ where: { username } });
  if (!user) return res.status(404).json({ message: "User not found" });
  const [userSettings] = await Settings.upsert({ UserId: user.id, ...settings });
  return res.json({ message: "Settings saved successfully", settings: userSettings });
};

export const getSettings = async (req, res) => {
  const { username } = req.params;
  const user = await User.findOne({ where: { username }, include: Settings });
  if (!user || !user.Settings) return res.status(404).json({ message: "Settings not found" });
  return res.json({ settings: user.Settings });
};
