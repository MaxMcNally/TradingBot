import { DataTypes } from "sequelize";
import sequelize from "../db.js";
import User from "./User.js";

const Settings = sequelize.define("Settings", {
  theme: DataTypes.STRING,
  notifications: DataTypes.BOOLEAN,
});

Settings.belongsTo(User, { onDelete: "CASCADE" });
User.hasOne(Settings);

export default Settings;
