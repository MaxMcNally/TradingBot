import React, { useState, useEffect, useMemo } from 'react';
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
  Divider,
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
import { useNavigate } from 'react-router-dom';
import {
  startTradingSession,
  stopTradingSession,
  pauseTradingSession,
  resumeTradingSession,
  getActiveTradingSessionsList,
  formatCurrency,
  StartTradingSessionRequest,
  TradingSession,
} from '../../api/tradingApi';
import { BillingPlan, PlanBotLimits } from '../../api';
import { PlanTier } from '../../types/user';
import { getMarketStatus, formatMarketTime } from '../../utils/marketHours';
import { getNextPlanTier } from '../../constants/plans';

interface TradingSessionControlsProps {
  userId: number;
  selectedStocks: string[];
  selectedStrategy: string;
  strategyParameters: Record<string, any>;
  onSessionStarted: (session: TradingSession) => void;
  onSessionStopped: () => void;
  planTier?: PlanTier;
  planLimits?: PlanBotLimits;
  availablePlans?: BillingPlan[];
  isPlanDataLoading?: boolean;
}

const TradingSessionControls: React.FC<TradingSessionControlsProps> = ({
  userId,
  selectedStocks,
  selectedStrategy,
  strategyParameters,
  onSessionStarted,
  onSessionStopped,
  planTier = 'FREE',
  planLimits,
  availablePlans,
  isPlanDataLoading
}) => {
  const navigate = useNavigate();
  const [activeSessions, setActiveSessions] = useState<TradingSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [upgradeTierOverride, setUpgradeTierOverride] = useState<PlanTier | null>(null);
  
  // Session configuration
  const [mode, setMode] = useState<'PAPER' | 'LIVE'>('PAPER');
  const [initialCash, setInitialCash] = useState(10000);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  
  // Time controls
  const [enableScheduledEnd, setEnableScheduledEnd] = useState(false);
  const [scheduledEndTime, setScheduledEndTime] = useState('');
  const [marketStatus, setMarketStatus] = useState(getMarketStatus());
  const effectivePlanLimits: PlanBotLimits = planLimits || { maxActiveBots: 1, maxConfiguredBots: 1 };
  const maxBotsAllowed = effectivePlanLimits.maxActiveBots;
  const activeBotCount = activeSessions.length;
  const hasReachedLimit = activeBotCount >= maxBotsAllowed;
  const fallbackNextTier = getNextPlanTier(planTier);
  const planLabel = planTier ? `${planTier.charAt(0)}${planTier.slice(1).toLowerCase()}` : 'Free';
  const upgradePlan = useMemo(() => {
    if (!availablePlans || !availablePlans.length) {
      return null;
    }
    const targetTier = upgradeTierOverride || fallbackNextTier;
    if (!targetTier) {
      return null;
    }
    return availablePlans.find(plan => plan.tier === targetTier) || null;
  }, [availablePlans, fallbackNextTier, upgradeTierOverride]);

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

  useEffect(() => {
    if (!hasReachedLimit) {
      setUpgradeTierOverride(null);
    }
  }, [hasReachedLimit]);

  const checkActiveSession = async () => {
    if (!userId || isNaN(userId)) {
      console.warn('Invalid userId:', userId);
      return;
    }
    
    try {
      console.log('Checking active sessions for user:', userId);
      const response = await getActiveTradingSessionsList(userId);
      const sessions = response.data?.data?.sessions || [];
      setActiveSessions(sessions);
    } catch (err: any) {
      if (err.response?.status === 404) {
        console.log('No active sessions found');
        setActiveSessions([]);
      } else {
        console.error('Error checking active sessions:', err);
        setError('Failed to check active session status');
      }
    }
  };

  const handleStartSession = async () => {
    if (!userId || isNaN(userId)) {
      setError('Invalid user ID');
      return;
    }

    if (hasReachedLimit) {
      const nextTier = fallbackNextTier;
      setError(`You've reached the ${maxBotsAllowed} active bot limit for the ${planLabel} plan.`);
      if (nextTier) {
        setUpgradeTierOverride(nextTier);
      }
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
      };

      const response = await startTradingSession(request);
      
      if (response.data.success) {
        setSuccess('Trading session started successfully!');
        setShowStartDialog(false);
        setActiveStep(0);
        setUpgradeTierOverride(null);
        
        // Refresh active session
        await checkActiveSession();
        
        // Notify parent component
        if (response.data.session) {
          onSessionStarted(response.data.session);
        }
      } else {
        setError(response.data.message || 'Failed to start trading session');
      }
    } catch (err: any) {
      console.error('Error starting trading session:', err);
      const serverMessage = err.response?.data?.message || 'Failed to start trading session';
      setError(serverMessage);
      if (err.response?.data?.errorCode === 'BOT_LIMIT_EXCEEDED') {
        const targetTier: PlanTier | undefined = err.response?.data?.upgrade?.tier;
        if (targetTier) {
          setUpgradeTierOverride(targetTier);
        } else if (fallbackNextTier) {
          setUpgradeTierOverride(fallbackNextTier);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStopSession = async (sessionId: number) => {
    console.log('Stopping session:', sessionId);

    try {
      setLoading(true);
      setError(null);

      const response = await stopTradingSession(sessionId);
      console.log('Stop session response:', response.data);
      
      setSuccess('Trading session stopped successfully!');
      
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

  const handlePauseSession = async (sessionId: number) => {
    try {
      setLoading(true);
      setError(null);

      await pauseTradingSession(sessionId);
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

  const handleResumeSession = async (sessionId: number) => {
    try {
      setLoading(true);
      setError(null);

      await resumeTradingSession(sessionId);
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

  const handleUpgradeClick = () => {
    if (!upgradePlan) return;
    navigate('/checkout', { state: { planTier: upgradePlan.tier } });
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

        <Alert severity={hasReachedLimit ? 'warning' : 'info'} sx={{ mb: 2 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            flexDirection={{ xs: 'column', md: 'row' }}
            gap={1}
          >
            <Box>
              <Typography variant="subtitle2">
                {planLabel} plan • {activeBotCount}/{maxBotsAllowed} active bots
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {hasReachedLimit
                  ? 'You have reached the concurrent bot limit for your current plan.'
                  : 'You are within your current bot allocation.'}
              </Typography>
              {upgradePlan && (
                <Typography variant="body2" color="textSecondary">
                  Need more capacity? Upgrade to {upgradePlan.name} for up to {upgradePlan.botLimits.maxActiveBots} active bots.
                </Typography>
              )}
            </Box>
            {upgradePlan && (
              <Button
                variant={hasReachedLimit ? 'contained' : 'outlined'}
                color="secondary"
                onClick={handleUpgradeClick}
                disabled={isPlanDataLoading}
              >
                {hasReachedLimit ? `Upgrade to ${upgradePlan.name}` : `Explore ${upgradePlan.name}`}
              </Button>
            )}
          </Box>
        </Alert>

        <Box mt={2}>
          <Typography variant="subtitle1" gutterBottom>
            Active Bots ({activeBotCount}/{maxBotsAllowed})
          </Typography>
          {activeSessions.length === 0 ? (
            <Alert severity="info">
              No active bots yet. Configure a session and press start to launch your first bot.
            </Alert>
          ) : (
            <Box display="flex" flexDirection="column" gap={2}>
              {activeSessions.map((session) => (
                <Card variant="outlined" key={session.id}>
                  <CardContent
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      justifyContent: 'space-between',
                      alignItems: { xs: 'flex-start', md: 'center' },
                      gap: 2
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2">
                        Bot #{session.id} • {session.mode} mode
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Started {new Date(session.start_time).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Trades: {session.total_trades} | P&L: {formatCurrency(session.total_pnl || 0)}
                      </Typography>
                    </Box>
                    <Box>
                      {session.status === 'ACTIVE' ? (
                        <Tooltip title="Pause bot">
                          <IconButton onClick={() => handlePauseSession(session.id)} disabled={loading}>
                            <Pause />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Resume bot">
                          <IconButton onClick={() => handleResumeSession(session.id)} disabled={loading}>
                            <PlayArrow />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Stop bot">
                        <IconButton onClick={() => handleStopSession(session.id)} disabled={loading} color="error">
                          <Stop />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>

        {/* Session Controls */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrow />}
              onClick={() => setShowStartDialog(true)}
              disabled={loading || selectedStocks.length === 0 || !selectedStrategy || hasReachedLimit}
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
              <CheckCircle color={!hasReachedLimit ? 'success' : 'error'} fontSize="small" />
              <Typography variant="body2">
                Bot slots available ({Math.max(maxBotsAllowed - activeBotCount, 0)} remaining)
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
                <StepLabel>Review</StepLabel>
              </Step>
            </Stepper>
            {getStepContent(activeStep)}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>
              Cancel
            </Button>
            {activeStep > 0 && (
              <Button onClick={handleBackStep}>
                Back
              </Button>
            )}
            {activeStep < 1 ? (
              <Button onClick={handleNextStep} variant="contained">
                Next
              </Button>
            ) : (
              <Button
                onClick={handleStartSession}
                variant="contained"
                disabled={loading || hasReachedLimit}
                startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
              >
                Start Session
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TradingSessionControls;
