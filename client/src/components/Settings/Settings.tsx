import React, { useEffect, useState } from "react";
import { 
  getSettings, 
  saveSetting, 
  updateAccountSettings,
  requestEmailVerification,
  setup2FA,
  enable2FA,
  disable2FA,
  getAlpacaStatus,
  connectAlpacaAccount,
  disconnectAlpacaAccount,
  testAlpacaConnection
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
import { SettingsProps, Setting, AccountSettings, AlpacaConnectionStatus } from "./Settings.types";

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
  const [alpacaStatus, setAlpacaStatus] = useState<AlpacaConnectionStatus | null>(null);
  const [alpacaForm, setAlpacaForm] = useState<{ apiKey: string; apiSecret: string }>({ apiKey: "", apiSecret: "" });
  const [alpacaLoading, setAlpacaLoading] = useState<boolean>(false);
  const [alpacaMessage, setAlpacaMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchAlpacaStatus = async (): Promise<void> => {
    try {
      const statusResponse = await getAlpacaStatus();
      setAlpacaStatus(statusResponse.data);
    } catch (statusError) {
      console.error("Failed to load Alpaca status:", statusError);
    }
  };

  useEffect(() => {
    if (user) {
      getSettings(user.id).then(res => setSettings(res.data));
      setAccountSettings({
        name: user.name || "",
        email: user.email || "",
        username: user.username || ""
      });
      fetchAlpacaStatus();
    }
  }, [user]);

  const getApiErrorMessage = (err: any, fallback: string): string => {
    return err?.response?.data?.message || err?.message || fallback;
  };

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

  const handleAlpacaFieldChange = (field: "apiKey" | "apiSecret", value: string) => {
    setAlpacaForm(prev => ({
      ...prev,
      [field]: value
    }));
    setAlpacaMessage(null);
  };

  const handleConnectAlpaca = async (): Promise<void> => {
    if (!alpacaForm.apiKey || !alpacaForm.apiSecret) {
      setAlpacaMessage({ type: "error", text: "Provide both API key and secret before connecting." });
      return;
    }
    setAlpacaLoading(true);
    setAlpacaMessage(null);
    try {
      await connectAlpacaAccount({
        apiKey: alpacaForm.apiKey.trim(),
        apiSecret: alpacaForm.apiSecret.trim(),
        isPaperOnly: true
      });
      setAlpacaMessage({ type: "success", text: "Alpaca account connected successfully." });
      setAlpacaForm({ apiKey: "", apiSecret: "" });
      await fetchAlpacaStatus();
    } catch (err: any) {
      setAlpacaMessage({ type: "error", text: getApiErrorMessage(err, "Failed to connect to Alpaca.") });
    } finally {
      setAlpacaLoading(false);
    }
  };

  const handleTestAlpaca = async (): Promise<void> => {
    setAlpacaLoading(true);
    setAlpacaMessage(null);
    try {
      const payload = alpacaForm.apiKey && alpacaForm.apiSecret
        ? { apiKey: alpacaForm.apiKey.trim(), apiSecret: alpacaForm.apiSecret.trim() }
        : undefined;
      const response = await testAlpacaConnection(payload);
      const buyingPower = response.data?.account?.buying_power;
      setAlpacaMessage({
        type: "success",
        text: buyingPower
          ? `Connection verified. Buying power: ${buyingPower}.`
          : "Connection verified successfully."
      });
      await fetchAlpacaStatus();
    } catch (err: any) {
      setAlpacaMessage({ type: "error", text: getApiErrorMessage(err, "Failed to verify Alpaca connection.") });
    } finally {
      setAlpacaLoading(false);
    }
  };

  const handleDisconnectAlpaca = async (): Promise<void> => {
    setAlpacaLoading(true);
    setAlpacaMessage(null);
    try {
      await disconnectAlpacaAccount();
      setAlpacaMessage({ type: "success", text: "Alpaca account disconnected." });
      await fetchAlpacaStatus();
    } catch (err: any) {
      setAlpacaMessage({ type: "error", text: getApiErrorMessage(err, "Failed to disconnect Alpaca.") });
    } finally {
      setAlpacaLoading(false);
    }
  };

  const alpacaEnabled = alpacaStatus?.enabled !== false;
  const alpacaConnected = Boolean(alpacaStatus?.status?.connected);
  const alpacaKeyLastFour = alpacaStatus?.status?.keyLastFour;
  const alpacaUpdatedAt = alpacaStatus?.status?.updatedAt
    ? new Date(alpacaStatus.status.updatedAt).toLocaleString()
    : null;

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
      
      {/* Alpaca Paper Trading Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Alpaca Paper Trading
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Securely connect your Alpaca paper account so live bots can forward BUY/SELL signals during development or staging.
        </Typography>

        {!alpacaEnabled && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Paper trading connections can only be managed in development or staging environments.
          </Alert>
        )}

        {alpacaMessage && (
          <Alert severity={alpacaMessage.type} sx={{ mt: 2 }}>
            {alpacaMessage.text}
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
          <Typography variant="subtitle2">
            Status:{" "}
            {alpacaConnected
              ? `Connected (Key ••••${alpacaKeyLastFour || "----"})`
              : "Not connected"}
          </Typography>
          {alpacaUpdatedAt && (
            <Typography variant="caption" color="text.secondary">
              Last updated {alpacaUpdatedAt}
            </Typography>
          )}

          <TextField
            label="Alpaca API Key"
            value={alpacaForm.apiKey}
            onChange={(e) => handleAlpacaFieldChange("apiKey", e.target.value)}
            fullWidth
            autoComplete="off"
            disabled={!alpacaEnabled || alpacaLoading}
          />

          <TextField
            label="Alpaca Secret Key"
            value={alpacaForm.apiSecret}
            onChange={(e) => handleAlpacaFieldChange("apiSecret", e.target.value)}
            type="password"
            fullWidth
            autoComplete="new-password"
            disabled={!alpacaEnabled || alpacaLoading}
          />

          <Typography variant="caption" color="text.secondary">
            Keys are encrypted at rest and only used to submit paper trades; nothing is logged.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              onClick={handleConnectAlpaca}
              disabled={alpacaLoading || !alpacaEnabled}
            >
              {alpacaLoading ? <CircularProgress size={20} /> : alpacaConnected ? "Update connection" : "Connect"}
            </Button>

            <Button
              variant="outlined"
              onClick={handleTestAlpaca}
              disabled={alpacaLoading || !alpacaEnabled}
            >
              {alpacaLoading ? <CircularProgress size={20} /> : "Test connection"}
            </Button>

            <Button
              color="warning"
              variant="outlined"
              onClick={handleDisconnectAlpaca}
              disabled={alpacaLoading || !alpacaConnected}
            >
              {alpacaLoading ? <CircularProgress size={20} /> : "Disconnect"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Settings;
