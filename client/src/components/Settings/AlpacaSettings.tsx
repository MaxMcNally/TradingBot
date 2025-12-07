import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  InputAdornment,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  Link as LinkIcon,
  LinkOff,
  Info,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import {
  connectAlpaca,
  disconnectAlpaca,
  getAlpacaStatus,
  AlpacaStatusResponse,
  AlpacaConnectRequest,
} from '../../api';

interface AlpacaSettingsProps {
  userId: string;
}

const AlpacaSettings: React.FC<AlpacaSettingsProps> = ({ userId }) => {
  const [status, setStatus] = useState<AlpacaStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  
  // Form state
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showApiSecret, setShowApiSecret] = useState(false);
  
  // UI state
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [showHelp, setShowHelp] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  // Fetch status on mount
  useEffect(() => {
    fetchStatus();
  }, [userId]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await getAlpacaStatus();
      setStatus(response.data);
    } catch (err: any) {
      console.error('Error fetching Alpaca status:', err);
      setStatus({
        connected: false,
        tradingMode: null,
        environment: 'unknown',
        account: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setError('');
    setSuccess('');
    
    // Validate inputs
    if (!apiKey.trim()) {
      setError('API Key is required');
      return;
    }
    if (!apiSecret.trim()) {
      setError('API Secret is required');
      return;
    }
    if (apiKey.length < 10) {
      setError('API Key appears to be invalid (too short)');
      return;
    }
    if (apiSecret.length < 20) {
      setError('API Secret appears to be invalid (too short)');
      return;
    }

    setConnecting(true);
    try {
      const request: AlpacaConnectRequest = {
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
        // Always paper trading in dev/staging; live trading in production
        isPaper: process.env.NODE_ENV !== 'production',
      };

      const response = await connectAlpaca(request);
      
      if (response.data.success) {
        setSuccess(`Successfully connected to Alpaca (${response.data.tradingMode} trading mode)`);
        setApiKey('');
        setApiSecret('');
        await fetchStatus();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 
        (Array.isArray(err.response?.data?.details) ? err.response?.data?.details.join(', ') : err.response?.data?.details) || 
        'Failed to connect to Alpaca';
      setError(errorMessage);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setShowDisconnectDialog(false);
    setError('');
    setSuccess('');
    setDisconnecting(true);

    try {
      const response = await disconnectAlpaca();
      if (response.data.success) {
        setSuccess('Alpaca account disconnected successfully');
        await fetchStatus();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to disconnect Alpaca account');
    } finally {
      setDisconnecting(false);
    }
  };

  const formatCurrency = (value: string | undefined): string => {
    if (!value) return '$0.00';
    const num = parseFloat(value);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={24} />
          <Typography>Loading Alpaca integration status...</Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          Alpaca Trading Integration
          {status?.connected ? (
            <Chip 
              icon={<CheckCircle />} 
              label="Connected" 
              color="success" 
              size="small" 
            />
          ) : (
            <Chip 
              icon={<ErrorIcon />} 
              label="Not Connected" 
              color="default" 
              size="small" 
            />
          )}
        </Typography>
        <IconButton onClick={() => setShowHelp(!showHelp)} size="small">
          {showHelp ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={showHelp}>
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            About Alpaca Integration
          </Typography>
          <Typography variant="body2" paragraph>
            Connect your Alpaca account to enable paper trading with real market data.
            Your bots can send buy and sell signals that will be executed on your Alpaca paper trading account.
          </Typography>
          <Typography variant="body2" component="div">
            <strong>How to get API keys:</strong>
            <List dense>
              <ListItem sx={{ py: 0 }}>
                <ListItemText primary="1. Sign up for a free account at alpaca.markets" />
              </ListItem>
              <ListItem sx={{ py: 0 }}>
                <ListItemText primary="2. Go to your Paper Trading dashboard" />
              </ListItem>
              <ListItem sx={{ py: 0 }}>
                <ListItemText primary="3. Generate API Keys from the API section" />
              </ListItem>
              <ListItem sx={{ py: 0 }}>
                <ListItemText primary="4. Copy your API Key ID and Secret Key" />
              </ListItem>
            </List>
          </Typography>
        </Alert>
      </Collapse>

      {/* Environment Notice */}
      {status?.environment !== 'production' && (
        <Alert severity="warning" icon={<Warning />} sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Paper Trading Only:</strong> Live trading is disabled in {status?.environment || 'development'} environment.
            All trades will be simulated using Alpaca's paper trading system.
          </Typography>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {status?.connected ? (
        // Connected state - show account info
        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" fontSize="small" />
            Account Connected
          </Typography>
          
          <Box sx={{ 
            bgcolor: 'background.default', 
            p: 2, 
            borderRadius: 1, 
            mb: 2 
          }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ minWidth: 150 }}>
                <Typography variant="caption" color="text.secondary">
                  Trading Mode
                </Typography>
                <Typography variant="body2">
                  <Chip 
                    label={status.tradingMode?.toUpperCase() || 'PAPER'} 
                    color={status.tradingMode === 'paper' ? 'primary' : 'error'}
                    size="small"
                  />
                </Typography>
              </Box>
              
              <Box sx={{ minWidth: 150 }}>
                <Typography variant="caption" color="text.secondary">
                  Account Status
                </Typography>
                <Typography variant="body2">
                  <Chip 
                    label={status.account?.status || 'Unknown'} 
                    color={status.account?.status === 'ACTIVE' ? 'success' : 'warning'}
                    size="small"
                  />
                </Typography>
              </Box>
              
              <Box sx={{ minWidth: 150 }}>
                <Typography variant="caption" color="text.secondary">
                  API Key
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  {status.maskedApiKey || '****'}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Portfolio Value
                </Typography>
                <Typography variant="h6" color="primary">
                  {formatCurrency(status.account?.portfolioValue)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Cash
                </Typography>
                <Typography variant="h6">
                  {formatCurrency(status.account?.cash)}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Buying Power
                </Typography>
                <Typography variant="h6" color="success.main">
                  {formatCurrency(status.account?.buyingPower)}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<LinkIcon />}
              onClick={fetchStatus}
              disabled={loading}
            >
              Refresh Status
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<LinkOff />}
              onClick={() => setShowDisconnectDialog(true)}
              disabled={disconnecting}
            >
              {disconnecting ? <CircularProgress size={20} /> : 'Disconnect'}
            </Button>
          </Box>
        </Box>
      ) : (
        // Not connected - show connection form
        <Box>
          <Typography variant="body2" color="text.secondary" paragraph>
            Enter your Alpaca API credentials to enable paper trading. Your credentials are encrypted and stored securely.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              type={showApiKey ? 'text' : 'password'}
              fullWidth
              placeholder="PK..."
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowApiKey(!showApiKey)}
                      edge="end"
                    >
                      {showApiKey ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="Your Alpaca API Key ID (starts with PK for paper trading)"
            />

            <TextField
              label="API Secret"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              type={showApiSecret ? 'text' : 'password'}
              fullWidth
              placeholder="Enter your API Secret"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowApiSecret(!showApiSecret)}
                      edge="end"
                    >
                      {showApiSecret ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="Your Alpaca API Secret Key"
            />

            <Alert severity="info" icon={<Info />}>
              <Typography variant="body2">
                <strong>Security:</strong> Your API credentials are encrypted using AES-256 before being stored.
                We never store or transmit your credentials in plain text.
              </Typography>
            </Alert>

            <Button
              variant="contained"
              startIcon={connecting ? <CircularProgress size={20} color="inherit" /> : <LinkIcon />}
              onClick={handleConnect}
              disabled={connecting || !apiKey || !apiSecret}
              sx={{ alignSelf: 'flex-start' }}
            >
              {connecting ? 'Connecting...' : 'Connect Alpaca Account'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Disconnect Confirmation Dialog */}
      <Dialog
        open={showDisconnectDialog}
        onClose={() => setShowDisconnectDialog(false)}
      >
        <DialogTitle>Disconnect Alpaca Account?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to disconnect your Alpaca account? 
            This will remove your stored API credentials and disable paper trading.
            You can reconnect at any time with your API keys.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDisconnectDialog(false)}>Cancel</Button>
          <Button onClick={handleDisconnect} color="error" autoFocus>
            Disconnect
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AlpacaSettings;
