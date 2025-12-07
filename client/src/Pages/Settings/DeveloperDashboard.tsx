import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Divider,
  Stack,
  Tooltip,
  CircularProgress
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CheckCircle as CheckCircleIcon
} from "@mui/icons-material";
import {
  getApiKeys,
  createApiKey,
  deleteApiKey,
  getWebhooks,
  createWebhook,
  updateWebhook,
  toggleWebhook,
  deleteWebhook,
  getApiUsageLogs,
  getApiUsageStats,
  getWebhookLogs,
  ApiKey,
  ApiKeyWithSecret,
  Webhook,
  ApiUsageLog,
  ApiUsageStats,
  WebhookLog
} from "../../api";

type TabValue = "api-keys" | "webhooks" | "logs" | "docs";

const DeveloperDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabValue>("api-keys");
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Usage logs state
  const [apiUsageLogs, setApiUsageLogs] = useState<ApiUsageLog[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [usageStats, setUsageStats] = useState<ApiUsageStats | null>(null);
  const [selectedApiKeyFilter, setSelectedApiKeyFilter] = useState<number | undefined>(undefined);
  const [selectedWebhookFilter, setSelectedWebhookFilter] = useState<number | undefined>(undefined);

  // API Key state
  const [createKeyDialog, setCreateKeyDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyData, setNewKeyData] = useState<ApiKeyWithSecret | null>(null);
  const [showSecret, setShowSecret] = useState(false);

  // Webhook state
  const [createWebhookDialog, setCreateWebhookDialog] = useState(false);
  const [editWebhookDialog, setEditWebhookDialog] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const eventTypes = [
    { value: "bot.started", label: "Bot Started" },
    { value: "bot.finished", label: "Bot Finished" },
    { value: "bot.error", label: "Bot Error" },
    { value: "trade.executed", label: "Trade Executed" }
  ];

  useEffect(() => {
    if (activeTab === "api-keys") {
      loadApiKeys();
    } else if (activeTab === "webhooks") {
      loadWebhooks();
    } else if (activeTab === "logs") {
      loadUsageLogs();
      loadWebhookLogs();
      loadUsageStats();
    }
  }, [activeTab, selectedApiKeyFilter, selectedWebhookFilter]);

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const response = await getApiKeys();
      setApiKeys(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const loadWebhooks = async () => {
    try {
      setLoading(true);
      const response = await getWebhooks();
      setWebhooks(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  };

  const loadUsageLogs = async () => {
    try {
      setLoading(true);
      const response = await getApiUsageLogs({
        limit: 100,
        apiKeyId: selectedApiKeyFilter
      });
      setApiUsageLogs(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load API usage logs");
    } finally {
      setLoading(false);
    }
  };

  const loadWebhookLogs = async () => {
    try {
      setLoading(true);
      const response = await getWebhookLogs({
        limit: 100,
        webhookId: selectedWebhookFilter
      });
      setWebhookLogs(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load webhook logs");
    } finally {
      setLoading(false);
    }
  };

  const loadUsageStats = async () => {
    try {
      const response = await getApiUsageStats(30);
      setUsageStats(response.data.data);
    } catch (err: any) {
      console.error("Failed to load usage stats:", err);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      setError("Key name is required");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await createApiKey({ key_name: newKeyName.trim() });
      setNewKeyData(response.data.data);
      setNewKeyName("");
      setCreateKeyDialog(false);
      await loadApiKeys();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create API key");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiKey = async (keyId: number) => {
    if (!window.confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      await deleteApiKey(keyId);
      setSuccess("API key deleted successfully");
      await loadApiKeys();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete API key");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess("Copied to clipboard!");
    setTimeout(() => setSuccess(""), 2000);
  };

  const handleCreateWebhook = async () => {
    if (!webhookUrl.trim()) {
      setError("Webhook URL is required");
      return;
    }

    if (selectedEvents.length === 0) {
      setError("At least one event type must be selected");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await createWebhook({
        url: webhookUrl.trim(),
        event_types: selectedEvents,
        secret: webhookSecret.trim() || undefined
      });
      setWebhookUrl("");
      setWebhookSecret("");
      setSelectedEvents([]);
      setCreateWebhookDialog(false);
      setSuccess("Webhook created successfully");
      await loadWebhooks();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create webhook");
    } finally {
      setLoading(false);
    }
  };

  const handleEditWebhook = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setWebhookUrl(webhook.url);
    setWebhookSecret(webhook.secret || "");
    setSelectedEvents(webhook.event_types);
    setEditWebhookDialog(true);
  };

  const handleUpdateWebhook = async () => {
    if (!editingWebhook) return;

    if (!webhookUrl.trim()) {
      setError("Webhook URL is required");
      return;
    }

    if (selectedEvents.length === 0) {
      setError("At least one event type must be selected");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await updateWebhook(editingWebhook.id, {
        url: webhookUrl.trim(),
        event_types: selectedEvents,
        secret: webhookSecret.trim() || undefined
      });
      setEditWebhookDialog(false);
      setEditingWebhook(null);
      setWebhookUrl("");
      setWebhookSecret("");
      setSelectedEvents([]);
      setSuccess("Webhook updated successfully");
      await loadWebhooks();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to update webhook");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWebhook = async (webhook: Webhook) => {
    try {
      setLoading(true);
      setError("");
      await toggleWebhook(webhook.id, !webhook.is_active);
      setSuccess(`Webhook ${webhook.is_active ? "deactivated" : "activated"} successfully`);
      await loadWebhooks();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to toggle webhook");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWebhook = async (webhookId: number) => {
    if (!window.confirm("Are you sure you want to delete this webhook? This action cannot be undone.")) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      await deleteWebhook(webhookId);
      setSuccess("Webhook deleted successfully");
      await loadWebhooks();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete webhook");
    } finally {
      setLoading(false);
    }
  };

  const renderApiKeys = () => (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">API Keys</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateKeyDialog(true)}
        >
          Create API Key
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Key Prefix</TableCell>
              <TableCell>Last Used</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {apiKeys.map((key) => (
              <TableRow key={key.id}>
                <TableCell>{key.key_name}</TableCell>
                <TableCell>
                  <Chip label={key.key_prefix} size="small" />
                </TableCell>
                <TableCell>
                  {key.last_used_at
                    ? new Date(key.last_used_at).toLocaleDateString()
                    : "Never"}
                </TableCell>
                <TableCell>{new Date(key.created_at).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteApiKey(key.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {apiKeys.length === 0 && !loading && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
          No API keys created yet
        </Typography>
      )}

      {/* Create API Key Dialog */}
      <Dialog open={createKeyDialog} onClose={() => setCreateKeyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create API Key</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Key Name"
            fullWidth
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateKeyDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateApiKey} variant="contained" disabled={loading}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Show API Key/Secret Dialog */}
      <Dialog open={!!newKeyData} onClose={() => setNewKeyData(null)} maxWidth="sm" fullWidth>
        <DialogTitle>API Key Created</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Save these credentials now. You won't be able to see the secret again!
          </Alert>
          <TextField
            label="API Key"
            fullWidth
            value={newKeyData?.api_key || ""}
            InputProps={{ readOnly: true }}
            sx={{ mb: 2 }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="API Secret"
            fullWidth
            type={showSecret ? "text" : "password"}
            value={newKeyData?.api_secret || ""}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <IconButton onClick={() => setShowSecret(!showSecret)} edge="end">
                  {showSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              )
            }}
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCopyToClipboard(newKeyData?.api_key || "")}>
            Copy Key
          </Button>
          <Button onClick={() => handleCopyToClipboard(newKeyData?.api_secret || "")}>
            Copy Secret
          </Button>
          <Button onClick={() => setNewKeyData(null)} variant="contained">
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  const renderWebhooks = () => (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6">Webhooks</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setWebhookUrl("");
            setWebhookSecret("");
            setSelectedEvents([]);
            setCreateWebhookDialog(true);
          }}
        >
          Add Webhook
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>URL</TableCell>
              <TableCell>Events</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Triggered</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {webhooks.map((webhook) => (
              <TableRow key={webhook.id}>
                <TableCell>{webhook.url}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {webhook.event_types.map((event) => (
                      <Chip key={event} label={event} size="small" />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    label={webhook.is_active ? "Active" : "Inactive"}
                    color={webhook.is_active ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {webhook.last_triggered_at
                    ? new Date(webhook.last_triggered_at).toLocaleString()
                    : "Never"}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title={webhook.is_active ? "Deactivate" : "Activate"}>
                    <IconButton
                      size="small"
                      onClick={() => handleToggleWebhook(webhook)}
                    >
                      {webhook.is_active ? <CheckCircleIcon /> : <CheckCircleIcon />}
                    </IconButton>
                  </Tooltip>
                  <IconButton
                    size="small"
                    onClick={() => handleEditWebhook(webhook)}
                  >
                    <VisibilityIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteWebhook(webhook.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {webhooks.length === 0 && !loading && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: "center" }}>
          No webhooks configured yet
        </Typography>
      )}

      {/* Create Webhook Dialog */}
      <Dialog open={createWebhookDialog} onClose={() => setCreateWebhookDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Webhook</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Webhook URL"
            fullWidth
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://example.com/webhook"
            sx={{ mt: 1 }}
          />
          <TextField
            margin="dense"
            label="Secret (optional)"
            fullWidth
            type="password"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            helperText="Used to sign webhook payloads"
          />
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Event Types
          </Typography>
          <FormGroup>
            {eventTypes.map((event) => (
              <FormControlLabel
                key={event.value}
                control={
                  <Checkbox
                    checked={selectedEvents.includes(event.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEvents([...selectedEvents, event.value]);
                      } else {
                        setSelectedEvents(selectedEvents.filter((e) => e !== event.value));
                      }
                    }}
                  />
                }
                label={event.label}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateWebhookDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateWebhook} variant="contained" disabled={loading}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Webhook Dialog */}
      <Dialog open={editWebhookDialog} onClose={() => setEditWebhookDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Webhook</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Webhook URL"
            fullWidth
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            sx={{ mt: 1 }}
          />
          <TextField
            margin="dense"
            label="Secret (optional)"
            fullWidth
            type="password"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            helperText="Used to sign webhook payloads"
          />
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Event Types
          </Typography>
          <FormGroup>
            {eventTypes.map((event) => (
              <FormControlLabel
                key={event.value}
                control={
                  <Checkbox
                    checked={selectedEvents.includes(event.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEvents([...selectedEvents, event.value]);
                      } else {
                        setSelectedEvents(selectedEvents.filter((e) => e !== event.value));
                      }
                    }}
                  />
                }
                label={event.label}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditWebhookDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateWebhook} variant="contained" disabled={loading}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );

  const renderDocs = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Enterprise API Documentation
      </Typography>
      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Authentication
      </Typography>
      <Paper sx={{ p: 2, bgcolor: "grey.100", mb: 2 }}>
        <Typography variant="body2" component="pre" sx={{ fontFamily: "monospace" }}>
{`Use your API key in the request header:

X-API-Key: your_api_key_here

Or use Bearer token format:

Authorization: Bearer your_api_key_here`}
        </Typography>
      </Paper>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Base URL
      </Typography>
      <Paper sx={{ p: 2, bgcolor: "grey.100", mb: 2 }}>
        <Typography variant="body2" component="pre" sx={{ fontFamily: "monospace" }}>
          {(import.meta as any).env?.VITE_API_URL || "http://localhost:8001/api"}/enterprise
        </Typography>
      </Paper>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Endpoints
      </Typography>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Get All Bots
        </Typography>
        <Paper sx={{ p: 2, bgcolor: "grey.100", mb: 2 }}>
          <Typography variant="body2" component="pre" sx={{ fontFamily: "monospace" }}>
{`GET /enterprise/bots
Query params: limit (optional, default: 50)

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "status": "ACTIVE",
      "mode": "PAPER",
      "start_time": "2024-01-01T00:00:00Z",
      "initial_cash": 10000,
      "total_trades": 10,
      "winning_trades": 7,
      "total_pnl": 500.50
    }
  ]
}`}
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Get Active Bot
        </Typography>
        <Paper sx={{ p: 2, bgcolor: "grey.100", mb: 2 }}>
          <Typography variant="body2" component="pre" sx={{ fontFamily: "monospace" }}>
{`GET /enterprise/bots/active

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "status": "ACTIVE",
    "mode": "PAPER",
    "start_time": "2024-01-01T00:00:00Z",
    "initial_cash": 10000,
    "total_trades": 10,
    "winning_trades": 7,
    "total_pnl": 500.50
  }
}`}
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Get Bot by ID
        </Typography>
        <Paper sx={{ p: 2, bgcolor: "grey.100", mb: 2 }}>
          <Typography variant="body2" component="pre" sx={{ fontFamily: "monospace" }}>
{`GET /enterprise/bots/:botId

Response includes full bot details and trades array.`}
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Start Bot
        </Typography>
        <Paper sx={{ p: 2, bgcolor: "grey.100", mb: 2 }}>
          <Typography variant="body2" component="pre" sx={{ fontFamily: "monospace" }}>
{`POST /enterprise/bots
Body:
{
  "mode": "PAPER",
  "initialCash": 10000,
  "symbols": ["AAPL", "GOOGL"],
  "strategy": "MovingAverage",
  "scheduledEndTime": "2024-01-02T00:00:00Z" // optional
}`}
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Stop Bot
        </Typography>
        <Paper sx={{ p: 2, bgcolor: "grey.100", mb: 2 }}>
          <Typography variant="body2" component="pre" sx={{ fontFamily: "monospace" }}>
{`POST /enterprise/bots/:botId/stop`}
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Get Performance Metrics
        </Typography>
        <Paper sx={{ p: 2, bgcolor: "grey.100", mb: 2 }}>
          <Typography variant="body2" component="pre" sx={{ fontFamily: "monospace" }}>
{`GET /enterprise/performance
Query params: limit (optional, default: 50)

Returns performance metrics for all strategies and sessions.`}
          </Typography>
        </Paper>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          Get Stats Summary
        </Typography>
        <Paper sx={{ p: 2, bgcolor: "grey.100", mb: 2 }}>
          <Typography variant="body2" component="pre" sx={{ fontFamily: "monospace" }}>
{`GET /enterprise/stats

Returns aggregate statistics:
{
  "total_bots": 10,
  "active_bots": 1,
  "total_trades": 100,
  "win_rate": 65.5,
  "total_pnl": 5000.00,
  "average_return": 12.5,
  "average_win_rate": 65.0
}`}
          </Typography>
        </Paper>
      </Box>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Webhooks
      </Typography>
      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle1" gutterBottom>
        Webhook Events
      </Typography>
      <Paper sx={{ p: 2, bgcolor: "grey.100", mb: 2 }}>
        <Typography variant="body2" component="pre" sx={{ fontFamily: "monospace" }}>
{`Available events:
- bot.started: Fired when a bot starts
- bot.finished: Fired when a bot finishes
- bot.error: Fired when a bot encounters an error
- trade.executed: Fired when a trade is executed

Webhook payload format:
{
  "event_type": "bot.started",
  "timestamp": "2024-01-01T00:00:00Z",
  "bot_id": 1,
  "data": {
    "status": "ACTIVE",
    "mode": "PAPER",
    "start_time": "2024-01-01T00:00:00Z",
    "initial_cash": 10000
  }
}

If a webhook secret is configured, the payload will be signed
with HMAC SHA256 and included in the X-Webhook-Signature header.`}
        </Typography>
      </Paper>
    </Box>
  );

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Developer Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your API keys, webhooks, and access the Enterprise API documentation
      </Typography>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="API Keys" value="api-keys" />
        <Tab label="Webhooks" value="webhooks" />
        <Tab label="Usage Logs" value="logs" />
        <Tab label="API Documentation" value="docs" />
      </Tabs>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && (
        <>
          {activeTab === "api-keys" && renderApiKeys()}
          {activeTab === "webhooks" && renderWebhooks()}
          {activeTab === "logs" && renderUsageLogs()}
          {activeTab === "docs" && renderDocs()}
        </>
      )}
    </Paper>
  );
};

export default DeveloperDashboard;

