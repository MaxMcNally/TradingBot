import React, { useEffect, useState } from "react";
import { getSettings, saveSetting, updateAccountSettings } from "../../api";
import { 
  TextField, 
  Button, 
  Box, 
  Typography, 
  Paper, 
  Divider,
  Alert,
  CircularProgress
} from "@mui/material";
import { SettingsProps, Setting, AccountSettings } from "./Settings.types";

const Settings: React.FC<SettingsProps> = ({ user }) => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [key, setKey] = useState<string>("");
  const [value, setValue] = useState<string>("");
  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    name: user?.name || "",
    email: user?.email || "",
    username: user?.username || ""
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    if (user) {
      getSettings(user.id).then(res => setSettings(res.data));
      setAccountSettings({
        name: user.name || "",
        email: user.email || "",
        username: user.username || ""
      });
    }
  }, [user]);

  const handleSave = async (): Promise<void> => {
    await saveSetting({ user_id: user.id, setting_key: key, setting_value: value });
    setSettings([...settings.filter(s => s.setting_key !== key), { setting_key: key, setting_value: value }]);
    setKey("");
    setValue("");
  };

  const handleAccountSave = async (): Promise<void> => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await updateAccountSettings(accountSettings);
      setSuccess("Account settings updated successfully!");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update account settings");
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = (field: keyof AccountSettings, value: string) => {
    setAccountSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: 600 }}>
      {/* Account Settings Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Account Settings
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Full Name"
            value={accountSettings.name}
            onChange={(e) => handleAccountChange("name", e.target.value)}
            fullWidth
          />
          
          <TextField
            label="Email"
            type="email"
            value={accountSettings.email}
            onChange={(e) => handleAccountChange("email", e.target.value)}
            fullWidth
          />
          
          <TextField
            label="Username"
            value={accountSettings.username}
            onChange={(e) => handleAccountChange("username", e.target.value)}
            fullWidth
          />
          
          <Button 
            variant="contained" 
            onClick={handleAccountSave}
            disabled={loading}
            sx={{ alignSelf: "flex-start" }}
          >
            {loading ? <CircularProgress size={20} /> : "Save Account Settings"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Settings;
