import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Chip,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel as MuiFormControlLabel,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Pause,
  Settings,
  Info,
  CheckCircle,
  TrendingUp,
  AccountBalance,
} from '@mui/icons-material';
import {
  startTradingSession,
  stopTradingSession,
  pauseTradingSession,
  resumeTradingSession,
  getActiveTradingSession,
  formatCurrency,
  StartTradingSessionRequest,
  TradingSession,
  TradingSessionSettings,
} from '../../api/tradingApi';
import { getMarketStatus, formatMarketTime } from '../../utils/marketHours';
import { TradingSessionSettingsForm } from '../../components/TradingSessionSettingsForm';

interface TradingSessionControlsProps {
  userId: number;
  selectedStocks: string[];
  selectedStrategy: string;
  strategyParameters: Record<string, any>;
  onSessionStarted: (session: TradingSession) => void;
  onSessionStopped: () => void;
}

const TradingSessionControls: React.FC<TradingSessionControlsProps> = ({
  userId,
  selectedStocks,
  selectedStrategy,
  strategyParameters,
  onSessionStarted,
  onSessionStopped,
}) => {
  const [activeSession, setActiveSession] = useState<TradingSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Session configuration
  const [mode, setMode] = useState<'PAPER' | 'LIVE'>('PAPER');
  const [initialCash, setInitialCash] = useState(10000);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  // Time controls
  const [enableScheduledEnd, setEnableScheduledEnd] = useState(false);
  const [scheduledEndTime, setScheduledEndTime] = useState('');
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());
  
  // Session settings
  const [sessionSettings, setSessionSettings] = useState<Partial<TradingSessionSettings>>({});

  useEffect(() => {
    if (userId && !isNaN(userId)) {
      checkActiveSession();
    }
  }, [userId]);

  // Update market status every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketStatus(getMarketStatus());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const checkActiveSession = async () => {
    if (!userId || isNaN(userId)) {
      console.warn('Invalid userId:', userId);
      return;
    }
    
    try {
      console.log('Checking active session for user:', userId);
      const response = await getActiveTradingSession(userId);
      console.log('Active session response:', response.data);
      setActiveSession(response.data);
    } catch (err: any) {
      // Check if it's a 404 error (no active session found)
      if (err.response?.status === 404) {
        console.log('No active session found');
        setActiveSession(null);
      } else {
        console.error('Error checking active session:', err);
        setError('Failed to check active session status');
      }
    }
  };

  const handleStartSession = async () => {
    if (!userId || isNaN(userId)) {
      setError('Invalid user ID');
      return;
    }

    if (selectedStocks.length === 0) {
      setError('Please select at least one stock to trade');
      return;
    }

    if (!selectedStrategy) {
      setError('Please select a trading strategy');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const request: StartTradingSessionRequest = {
        userId,
        mode,
        initialCash,
        symbols: selectedStocks,
        strategy: selectedStrategy,
        strategyParameters,
        scheduledEndTime: enableScheduledEnd && scheduledEndTime ? scheduledEndTime : undefined,
        settings: Object.keys(sessionSettings).length > 0 ? sessionSettings : undefined,
      };

      const response = await startTradingSession(request);
      
      if (response.data.success) {
        setSuccess('Trading session started successfully!');
        setShowStartDialog(false);
        setActiveStep(0);
        
        // Refresh active session
        await checkActiveSession();
        
        // Notify parent component
        if (response.data.sessionId) {
          // We would need to fetch the full session object here
          // For now, we'll just call the callback
          onSessionStarted(response.data as any);
        }
      } else {
        setError(response.data.message || 'Failed to start trading session');
      }
    } catch (err: any) {
      console.error('Error starting trading session:', err);
      setError(err.response?.data?.message || 'Failed to start trading session');
    } finally {
      setLoading(false);
    }
  };

  const handleStopSession = async () => {
    if (!activeSession) {
      console.warn('No active session to stop');
      return;
    }

    console.log('Stopping session:', activeSession.id);

    try {
      setLoading(true);
      setError(null);

      const response = await stopTradingSession(activeSession.id);
      console.log('Stop session response:', response.data);
      
      setSuccess('Trading session stopped successfully!');
      
      setActiveSession(null);
      onSessionStopped();
      
      // Refresh the active session status
      await checkActiveSession();
    } catch (err: any) {
      console.error('Error stopping trading session:', err);
      setError(err.response?.data?.message || 'Failed to stop trading session');
    } finally {
      setLoading(false);
    }
  };

  const handlePauseSession = async () => {
    if (!activeSession) return;

    try {
      setLoading(true);
      setError(null);

      await pauseTradingSession(activeSession.id);
      setSuccess('Trading session paused successfully!');
      
      // Refresh session status
      await checkActiveSession();
    } catch (err: any) {
      console.error('Error pausing trading session:', err);
      setError(err.response?.data?.message || 'Failed to pause trading session');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSession = async () => {
    if (!activeSession) return;

    try {
      setLoading(true);
      setError(null);

      await resumeTradingSession(activeSession.id);
      setSuccess('Trading session resumed successfully!');
      
      // Refresh session status
      await checkActiveSession();
    } catch (err: any) {
      console.error('Error resuming trading session:', err);
      setError(err.response?.data?.message || 'Failed to resume trading session');
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBackStep = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleCloseDialog = () => {
    setShowStartDialog(false);
    setActiveStep(0);
    setError(null);
    setSessionSettings({});
  };
  
  const handleSettingsSubmit = async (settings: Partial<TradingSessionSettings>) => {
    setSessionSettings(settings);
    handleNextStep();
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Session Configuration
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <FormLabel component="legend">Trading Mode</FormLabel>
                  <RadioGroup
                    value={mode}
                    onChange={(e) => setMode(e.target.value as 'PAPER' | 'LIVE')}
                  >
                    <FormControlLabel
                      value="PAPER"
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="subtitle2">Paper Trading</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Simulate trades with real market data. No real money at risk.
                          </Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="LIVE"
                      control={<Radio />}
                      label={
                        <Box>
                          <Typography variant="subtitle2">Live Trading</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Execute real trades with real money. Use with caution!
                          </Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Initial Cash"
                  type="number"
                  value={initialCash}
                  onChange={(e) => setInitialCash(parseFloat(e.target.value))}
                  fullWidth
                  inputProps={{ min: 1000, max: 1000000, step: 1000 }}
                  helperText="Starting cash amount for the trading session"
                />
              </Grid>
              
              {/* Market Status */}
              <Grid item xs={12}>
                <Alert 
                  severity={marketStatus.isOpen ? "success" : "info"}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="subtitle2">
                    Market Status: {marketStatus.isOpen ? "Open" : "Closed"}
                  </Typography>
                  <Typography variant="body2">
                    {marketStatus.isOpen 
                      ? `Closes at ${formatMarketTime(marketStatus.nextClose!)}`
                      : `Opens ${formatMarketTime(marketStatus.nextOpen!)}`
                    }
                  </Typography>
                </Alert>
              </Grid>
              
              {/* Scheduled End Time */}
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <MuiFormControlLabel
                    control={
                      <Switch
                        checked={enableScheduledEnd}
                        onChange={(e) => setEnableScheduledEnd(e.target.checked)}
                      />
                    }
                    label="Enable Scheduled End Time"
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    Automatically stop the session at a specific time
                  </Typography>
                </FormControl>
              </Grid>
              
              {enableScheduledEnd && (
                <Grid item xs={12}>
                  <TextField
                    label="Session End Time"
                    type="datetime-local"
                    value={scheduledEndTime}
                    onChange={(e) => setScheduledEndTime(e.target.value)}
                    fullWidth
                    InputLabelProps={{
                      shrink: true,
                    }}
                    helperText="The session will automatically stop at this time"
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Trading Session Settings
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              Configure risk management, order execution, and trading window settings for this session. You can skip this step to use default settings.
            </Typography>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button onClick={handleNextStep} variant="outlined" size="small">
                Skip Settings
              </Button>
            </Box>
            <TradingSessionSettingsForm
              initialSettings={sessionSettings}
              onSubmit={handleSettingsSubmit}
              onCancel={handleBackStep}
              submitLabel="Continue to Review"
              showAdvanced={true}
            />
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Configuration
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      <AccountBalance sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Trading Mode
                    </Typography>
                    <Chip
                      label={mode}
                      color={mode === 'PAPER' ? 'primary' : 'error'}
                      variant="outlined"
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Initial Cash
                    </Typography>
                    <Typography variant="h6">
                      {formatCurrency(initialCash)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Selected Stocks ({selectedStocks.length})
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {selectedStocks.map((stock) => (
                        <Chip key={stock} label={stock} size="small" />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Strategy: {selectedStrategy}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Parameters: {Object.entries(strategyParameters).map(([key, value]) => `${key}: ${value}`).join(', ')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              {/* Scheduled End Time */}
              {enableScheduledEnd && scheduledEndTime && (
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        Scheduled End Time
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {new Date(scheduledEndTime).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
              
              {/* Session Settings Summary */}
              {Object.keys(sessionSettings).length > 0 && (
                <Grid item xs={12}>
                  <Card variant="outlined" sx={{ borderColor: 'primary.main' }}>
                    <CardContent>
                      <Typography variant="subtitle2" gutterBottom>
                        <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Session Settings Configured
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Custom settings have been applied for risk management, order execution, and trading window.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  // Safety check for userId
  if (!userId || isNaN(userId)) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            Invalid user ID. Please log in again.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="h3" gutterBottom>
          Trading Session Controls
        </Typography>

        {/* Error/Success Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Active Session Status */}
        {activeSession && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="subtitle2">
                  Active Session #{activeSession.id} - {activeSession.mode} Mode
                </Typography>
                <Typography variant="body2">
                  Started: {new Date(activeSession.start_time).toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  Trades: {activeSession.total_trades} | P&L: {formatCurrency(activeSession.total_pnl || 0)}
                </Typography>
              </Box>
              <Box>
                <Tooltip title="Pause Session">
                  <IconButton onClick={handlePauseSession} disabled={loading}>
                    <Pause />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Stop Session">
                  <IconButton onClick={handleStopSession} disabled={loading} color="error">
                    <Stop />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Alert>
        )}

        {/* Session Controls */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrow />}
              onClick={() => setShowStartDialog(true)}
              disabled={loading || !!activeSession || selectedStocks.length === 0 || !selectedStrategy}
              fullWidth
              size="large"
            >
              Start Trading Session
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<Settings />}
              onClick={() => setShowStartDialog(true)}
              disabled={loading}
              fullWidth
              size="large"
            >
              Configure Session
            </Button>
          </Grid>
        </Grid>

        {/* Session Requirements */}
        <Box mt={3} p={2} bgcolor="grey.50" borderRadius={1}>
          <Typography variant="subtitle2" gutterBottom>
            <Info sx={{ mr: 1, verticalAlign: 'middle' }} />
            Session Requirements
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <CheckCircle color={selectedStocks.length > 0 ? 'success' : 'disabled'} fontSize="small" />
              <Typography variant="body2">
                Select stocks to trade ({selectedStocks.length} selected)
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <CheckCircle color={selectedStrategy ? 'success' : 'disabled'} fontSize="small" />
              <Typography variant="body2">
                Choose trading strategy ({selectedStrategy || 'None selected'})
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <CheckCircle color={!activeSession ? 'success' : 'disabled'} fontSize="small" />
              <Typography variant="body2">
                No active session running
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Start Session Dialog */}
        <Dialog
          open={showStartDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Start Trading Session
          </DialogTitle>
          <DialogContent>
            <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
              <Step>
                <StepLabel>Configuration</StepLabel>
              </Step>
              <Step>
                <StepLabel>Settings</StepLabel>
              </Step>
              <Step>
                <StepLabel>Review</StepLabel>
              </Step>
            </Stepper>
            {getStepContent(activeStep)}
          </DialogContent>
          {activeStep !== 1 && (
            <DialogActions>
              <Button onClick={handleCloseDialog}>
                Cancel
              </Button>
              {activeStep > 0 && (
                <Button onClick={handleBackStep}>
                  Back
                </Button>
              )}
              {activeStep < 2 ? (
                <Button onClick={handleNextStep} variant="contained">
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleStartSession}
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
                >
                  Start Session
                </Button>
              )}
            </DialogActions>
          )}
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TradingSessionControls;
