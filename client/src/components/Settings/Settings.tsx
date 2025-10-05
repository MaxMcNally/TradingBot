import React, { useEffect, useState } from "react";
import { getSettings, saveSetting } from "../../api";
import { TextField, Button, Box } from "@mui/material";
import { SettingsProps, Setting } from "./Settings.types";

const Settings: React.FC<SettingsProps> = ({ user }) => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [key, setKey] = useState<string>("");
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    if (user) {
      getSettings(user.id).then(res => setSettings(res.data));
    }
  }, [user]);

  const handleSave = async (): Promise<void> => {
    await saveSetting({ user_id: user.id, setting_key: key, setting_value: value });
    setSettings([...settings.filter(s => s.setting_key !== key), { setting_key: key, setting_value: value }]);
    setKey("");
    setValue("");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, width: 400 }}>
      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField label="Key" value={key} onChange={(e) => setKey(e.target.value)} />
        <TextField label="Value" value={value} onChange={(e) => setValue(e.target.value)} />
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </Box>
      {settings.map((s) => (
        <Box key={s.setting_key}>{s.setting_key}: {s.setting_value}</Box>
      ))}
    </Box>
  );
};

export default Settings;
