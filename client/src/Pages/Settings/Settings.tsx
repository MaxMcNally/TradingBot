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
  CircularProgress,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Drawer,
  ListItemButton,
  ListItemIcon
} from "@mui/material";
import {
  AccountCircle,
  CreditCard,
  Security,
  AccountBalance
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "../../hooks";
import { SettingsProps, Setting, AccountSettings } from "./Settings.types";
import AlpacaSettings from "./AlpacaSettings";

type SettingsSection = "account" | "subscription" | "alpaca" | "security";

const Settings: React.FC<SettingsProps> = ({ user }) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
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
  const navigate = useNavigate();
  const {
    subscription,
    history,
    isSubscriptionLoading,
    isMutating: isSubscriptionMutating,
    cancelSubscription
  } = useSubscription({ enabled: Boolean(user?.id) });
  const [subscriptionAlert, setSubscriptionAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  const formatTier = (tier?: string) => {
    if (!tier) return "Free";
    return `${tier.charAt(0)}${tier.slice(1).toLowerCase()}`;
  };

  const formatDate = (value?: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString();
  };

  const isPaidPlan = subscription?.planTier && subscription.planTier !== "FREE";

  const handleCancelSubscription = async () => {
    setSubscriptionAlert(null);
    try {
      await cancelSubscription();
      setSubscriptionAlert({
        type: "success",
        message: "Subscription canceled. You're back on the Free plan."
      });
    } catch (err: any) {
      setSubscriptionAlert({
        type: "error",
        message: err?.response?.data?.error || "Failed to cancel subscription"
      });
    }
  };

  const sections = [
    { id: "account" as SettingsSection, label: "Account Settings", icon: <AccountCircle /> },
    { id: "subscription" as SettingsSection, label: "Subscription", icon: <CreditCard /> },
    { id: "alpaca" as SettingsSection, label: "Alpaca Trading Integration", icon: <AccountBalance /> },
    { id: "security" as SettingsSection, label: "Security", icon: <Security /> },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "account":
        return (
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
        );

      case "subscription":
        return (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Subscription
            </Typography>
            <Divider sx={{ my: 2 }} />
            {subscriptionAlert && (
              <Alert severity={subscriptionAlert.type} sx={{ mb: 2 }}>
                {subscriptionAlert.message}
              </Alert>
            )}
            {isSubscriptionLoading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Skeleton height={32} />
                <Skeleton height={24} />
                <Skeleton height={64} />
              </Box>
            ) : (
              <>
                <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                  <Chip label={`${formatTier(subscription?.planTier || "FREE")} Plan`} color="primary" />
                  <Chip label={`Status: ${subscription?.planStatus || "ACTIVE"}`} color="default" />
                  <Typography variant="body2" color="text.secondary">
                    Provider: {subscription?.provider || "NONE"}
                  </Typography>
                </Stack>

                <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Next renewal: {formatDate(subscription?.renewsAt)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Started: {formatDate(subscription?.startedAt)}
                  </Typography>
                </Box>

                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
                  <Button variant="contained" onClick={() => navigate("/pricing")}>
                    Explore Plans
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => navigate("/checkout", { state: { planTier: subscription?.planTier || "BASIC" } })}
                  >
                    Go to Checkout
                  </Button>
                  {isPaidPlan ? (
                    <Button
                      color="warning"
                      variant="outlined"
                      disabled={isSubscriptionMutating}
                      onClick={handleCancelSubscription}
                    >
                      Cancel Subscription
                    </Button>
                  ) : (
                    <Button
                      color="secondary"
                      variant="outlined"
                      onClick={() => navigate("/checkout", { state: { planTier: "BASIC" } })}
                    >
                      Upgrade to Basic
                    </Button>
                  )}
                </Stack>

                {history.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Recent activity
                    </Typography>
                    <List dense>
                      {history.slice(0, 3).map((entry) => (
                        <ListItem key={entry.id} disablePadding>
                          <ListItemText
                            primary={`${formatTier(entry.plan_tier)} • ${entry.status}`}
                            secondary={`Started ${formatDate(entry.started_at)}${entry.renews_at ? ` • Renews ${formatDate(entry.renews_at)}` : ''}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </>
            )}
          </Paper>
        );

      case "alpaca":
        return <AlpacaSettings userId={user?.id || ""} />;

      case "security":
        return (
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
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: "flex", gap: 3, flexDirection: { xs: "column", md: "row" } }}>
      {/* Left Navigation Menu */}
      <Paper 
        sx={{ 
          width: { xs: "100%", md: 240 },
          flexShrink: 0,
          p: 0
        }}
      >
        <List component="nav" sx={{ p: 0 }}>
          {sections.map((section) => (
            <ListItem key={section.id} disablePadding>
              <ListItemButton
                selected={activeSection === section.id}
                onClick={() => setActiveSection(section.id)}
                sx={{
                  "&.Mui-selected": {
                    backgroundColor: "primary.main",
                    color: "primary.contrastText",
                    "&:hover": {
                      backgroundColor: "primary.dark",
                    },
                    "& .MuiListItemIcon-root": {
                      color: "primary.contrastText",
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {section.icon}
                </ListItemIcon>
                <ListItemText primary={section.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Content Area */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        {renderContent()}
      </Box>
    </Box>
  );
};

export default Settings;
