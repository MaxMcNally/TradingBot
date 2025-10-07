import React, { useEffect, useState } from "react";
import { 
  getSettings, 
  saveSetting, 
  updateAccountSettings,
  requestEmailVerification,
  setup2FA,
  enable2FA,
  disable2FA
} from "../../api";
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
  const [twoFASetup, setTwoFASetup] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [twoFAToken, setTwoFAToken] = useState<string>("");
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

  const handleRequestEmailVerification = async (): Promise<void> => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await requestEmailVerification();
      setSuccess("Verification email sent (token exposed in dev response).");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to send verification email");
    } finally {
      setLoading(false);
    }
  };

  const handleSetup2FA = async (): Promise<void> => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await setup2FA();
      setTwoFASetup(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to initialize 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async (): Promise<void> => {
    if (!twoFAToken) { setError("Enter 2FA code"); return; }
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await enable2FA(twoFAToken);
      setSuccess("Two-factor authentication enabled");
      setTwoFASetup(null);
      setTwoFAToken("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to enable 2FA");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async (): Promise<void> => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      await disable2FA();
      setSuccess("Two-factor authentication disabled");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to disable 2FA");
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

      {/* Security Settings Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Security
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="subtitle2">Email verification</Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Typography variant="body2">
              Status: {user?.email_verified ? "Verified" : "Not verified"}
            </Typography>
            {!user?.email_verified && (
              <Button variant="outlined" onClick={handleRequestEmailVerification} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : "Send verification"}
              </Button>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2">Two-factor authentication (TOTP)</Typography>
          {!user?.two_factor_enabled ? (
            <>
              {!twoFASetup ? (
                <Button variant="outlined" onClick={handleSetup2FA} disabled={loading} sx={{ alignSelf: "flex-start" }}>
                  {loading ? <CircularProgress size={20} /> : "Set up 2FA"}
                </Button>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Typography variant="body2">Scan this QR with your authenticator app, or use the secret below:</Typography>
                  {twoFASetup.qrCodeDataUrl && (
                    <Box component="img" src={twoFASetup.qrCodeDataUrl} alt="2FA QR" sx={{ maxWidth: 200 }} />
                  )}
                  <TextField label="Secret" value={twoFASetup.secret} size="small" InputProps={{ readOnly: true }} />
                  <TextField label="Enter 2FA Code" value={twoFAToken} onChange={(e)=>setTwoFAToken(e.target.value)} size="small" />
                  <Button variant="contained" onClick={handleEnable2FA} disabled={loading} sx={{ alignSelf: "flex-start" }}>
                    {loading ? <CircularProgress size={20} /> : "Enable 2FA"}
                  </Button>
                </Box>
              )}
            </>
          ) : (
            <Button color="warning" variant="outlined" onClick={handleDisable2FA} disabled={loading} sx={{ alignSelf: "flex-start" }}>
              {loading ? <CircularProgress size={20} /> : "Disable 2FA"}
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default Settings;
