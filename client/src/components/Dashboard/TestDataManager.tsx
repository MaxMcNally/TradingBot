import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  FormControl,
  FormLabel,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Refresh,
  DataUsage,
  Settings,
  ExpandMore,
  PersonAdd,
  Delete,
} from '@mui/icons-material';

interface TestUser {
  id: number;
  username: string;
  email: string;
}

interface MockSession {
  sessionId: number;
  config: {
    userId: number;
    symbols: string[];
    strategy: string;
    mode: 'PAPER' | 'LIVE';
    tradeInterval: number;
    maxTrades: number;
    volatility: number;
  };
}

interface TestDataManagerProps {
  onTestUserCreated?: (user: TestUser) => void;
}

const TestDataManager: React.FC<TestDataManagerProps> = ({ onTestUserCreated }) => {
  const [testUser, setTestUser] = useState<TestUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeMockSessions, setActiveMockSessions] = useState<MockSession[]>([]);
  
  // Mock session configuration
  const [mockConfig, setMockConfig] = useState({
    symbols: ['AAPL', 'GOOGL', 'MSFT'],
    strategy: 'MovingAverage',
    mode: 'PAPER' as 'PAPER' | 'LIVE',
    tradeInterval: 30, // seconds
    maxTrades: 50,
    volatility: 0.05, // 5%
  });

  useEffect(() => {
    checkTestUser();
    fetchActiveMockSessions();
    
    // Refresh active sessions every 5 seconds
    const interval = setInterval(fetchActiveMockSessions, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkTestUser = async () => {
    try {
      const response = await fetch('/api/test/test-user');
      if (response.ok) {
        const data = await response.json();
        setTestUser(data.data);
      }
    } catch (err) {
      console.error('Error checking test user:', err);
    }
  };

  const createTestUser = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test/create-test-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTestUser({
          id: data.data.user.id,
          username: data.data.user.username,
          email: data.data.user.email,
        });
        setSuccess(`Test user created with ${data.data.sessions} sessions, ${data.data.trades} trades, and ${data.data.portfolioSnapshots} portfolio snapshots`);
        onTestUserCreated?.(testUser!);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to create test user');
    } finally {
      setLoading(false);
    }
  };

  const cleanupTestData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test/cleanup', {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTestUser(null);
        setSuccess('Test data cleaned up successfully');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to cleanup test data');
    } finally {
      setLoading(false);
    }
  };

  const startMockSession = async () => {
    if (!testUser) {
      setError('No test user available');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test/mock-sessions/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: testUser.id,
          ...mockConfig,
          tradeInterval: mockConfig.tradeInterval * 1000, // Convert to milliseconds
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(`Mock session started with ID: ${data.sessionId}`);
        fetchActiveMockSessions();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to start mock session');
    } finally {
      setLoading(false);
    }
  };

  const stopMockSession = async (sessionId: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/test/mock-sessions/${sessionId}/stop`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Mock session stopped successfully');
        fetchActiveMockSessions();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to stop mock session');
    } finally {
      setLoading(false);
    }
  };

  const stopAllMockSessions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/test/mock-sessions/stop-all', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('All mock sessions stopped successfully');
        fetchActiveMockSessions();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to stop all mock sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveMockSessions = async () => {
    try {
      const response = await fetch('/api/test/mock-sessions/active');
      if (response.ok) {
        const data = await response.json();
        setActiveMockSessions(data.data.activeSessions);
      }
    } catch (err) {
      console.error('Error fetching active mock sessions:', err);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="h3" gutterBottom>
          <DataUsage sx={{ mr: 1, verticalAlign: 'middle' }} />
          Test Data Manager
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

        {/* Test User Section */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">
              <PersonAdd sx={{ mr: 1, verticalAlign: 'middle' }} />
              Test User Management
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                {testUser ? (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Current Test User:
                    </Typography>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Chip label={testUser.username} color="primary" />
                      <Chip label={`ID: ${testUser.id}`} variant="outlined" />
                      <Chip label={testUser.email} variant="outlined" />
                    </Box>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Delete />}
                      onClick={cleanupTestData}
                      disabled={loading}
                    >
                      Cleanup Test Data
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      No test user found. Create one to start testing with historical data.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<PersonAdd />}
                      onClick={createTestUser}
                      disabled={loading}
                    >
                      Create Test User
                    </Button>
                  </Box>
                )}
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>

        {/* Mock Trading Section */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">
              <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
              Mock Trading Sessions
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {/* Mock Session Configuration */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Session Configuration
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Symbols (comma-separated)"
                  value={mockConfig.symbols.join(', ')}
                  onChange={(e) => setMockConfig({
                    ...mockConfig,
                    symbols: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                  })}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Strategy</InputLabel>
                  <Select
                    value={mockConfig.strategy}
                    onChange={(e) => setMockConfig({ ...mockConfig, strategy: e.target.value })}
                    label="Strategy"
                  >
                    <MenuItem value="MovingAverage">Moving Average</MenuItem>
                    <MenuItem value="BollingerBands">Bollinger Bands</MenuItem>
                    <MenuItem value="MeanReversion">Mean Reversion</MenuItem>
                    <MenuItem value="Momentum">Momentum</MenuItem>
                    <MenuItem value="Breakout">Breakout</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={mockConfig.mode === 'LIVE'}
                      onChange={(e) => setMockConfig({
                        ...mockConfig,
                        mode: e.target.checked ? 'LIVE' : 'PAPER'
                      })}
                    />
                  }
                  label="Live Mode"
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Trade Interval (seconds)"
                  type="number"
                  value={mockConfig.tradeInterval}
                  onChange={(e) => setMockConfig({
                    ...mockConfig,
                    tradeInterval: parseInt(e.target.value) || 30
                  })}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Max Trades"
                  type="number"
                  value={mockConfig.maxTrades}
                  onChange={(e) => setMockConfig({
                    ...mockConfig,
                    maxTrades: parseInt(e.target.value) || 50
                  })}
                  fullWidth
                  size="small"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Volatility (0-1)"
                  type="number"
                  step="0.01"
                  value={mockConfig.volatility}
                  onChange={(e) => setMockConfig({
                    ...mockConfig,
                    volatility: parseFloat(e.target.value) || 0.05
                  })}
                  fullWidth
                  size="small"
                  helperText="Price volatility for mock trades (0.05 = 5%)"
                />
              </Grid>
              
              {/* Mock Session Controls */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Session Controls
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrow />}
                  onClick={startMockSession}
                  disabled={loading || !testUser}
                  fullWidth
                >
                  Start Mock Session
                </Button>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Stop />}
                  onClick={stopAllMockSessions}
                  disabled={loading || activeMockSessions.length === 0}
                  fullWidth
                >
                  Stop All Sessions
                </Button>
              </Grid>
              
              {/* Active Sessions */}
              {activeMockSessions.length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Active Mock Sessions ({activeMockSessions.length})
                  </Typography>
                  {activeMockSessions.map((session) => (
                    <Box key={session.sessionId} display="flex" alignItems="center" gap={1} mb={1}>
                      <Chip label={`Session ${session.sessionId}`} size="small" />
                      <Chip label={session.config.strategy} size="small" variant="outlined" />
                      <Chip label={session.config.mode} size="small" variant="outlined" />
                      <Chip label={`${session.config.symbols.length} symbols`} size="small" variant="outlined" />
                      <Button
                        size="small"
                        color="error"
                        startIcon={<Stop />}
                        onClick={() => stopMockSession(session.sessionId)}
                        disabled={loading}
                      >
                        Stop
                      </Button>
                    </Box>
                  ))}
                </Grid>
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default TestDataManager;
