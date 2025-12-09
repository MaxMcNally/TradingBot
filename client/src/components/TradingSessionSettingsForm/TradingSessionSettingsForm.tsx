import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  FormControl,
  FormLabel,
  FormControlLabel,
  Switch,
  Button,
  Grid,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  Stack,
} from '@mui/material';
import {
  ExpandMore,
  Save,
  Settings,
  Security,
  ShoppingCart,
  Schedule,
  Tune,
} from '@mui/icons-material';
import {
  TradingSessionSettings,
  TimeInForce,
  OrderType,
  PositionSizingMethod,
  RebalanceFrequency,
  SlippageModel,
  TradingDay,
} from '../../api/tradingApi';

export interface TradingSessionSettingsFormProps {
  initialSettings?: Partial<TradingSessionSettings>;
  onSubmit: (settings: Partial<TradingSessionSettings>) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
  showAdvanced?: boolean;
}

const DEFAULT_SETTINGS: Partial<TradingSessionSettings> = {
  // Risk Management
  stop_loss_percentage: null,
  take_profit_percentage: null,
  max_position_size_percentage: 25.0,
  max_daily_loss_percentage: null,
  max_daily_loss_absolute: null,
  
  // Order Execution
  time_in_force: 'day',
  allow_partial_fills: true,
  extended_hours: false,
  order_type_default: 'market',
  limit_price_offset_percentage: null,
  
  // Position Management
  max_open_positions: 10,
  position_sizing_method: 'percentage',
  position_size_value: 10.0,
  rebalance_frequency: 'never',
  
  // Trading Window
  trading_hours_start: '09:30',
  trading_hours_end: '16:00',
  trading_days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
  
  // Advanced
  enable_trailing_stop: false,
  trailing_stop_percentage: null,
  enable_bracket_orders: false,
  enable_oco_orders: false,
  commission_rate: 0.0,
  slippage_model: 'none',
  slippage_value: 0.0,
};

const TRADING_DAYS: TradingDay[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const TradingSessionSettingsForm: React.FC<TradingSessionSettingsFormProps> = ({
  initialSettings = {},
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Save Settings',
  showAdvanced = false,
}) => {
  const [settings, setSettings] = useState<Partial<TradingSessionSettings>>({
    ...DEFAULT_SETTINGS,
    ...initialSettings,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedSection, setExpandedSection] = useState<string | false>(showAdvanced ? 'advanced' : 'risk');

  useEffect(() => {
    setSettings({
      ...DEFAULT_SETTINGS,
      ...initialSettings,
    });
  }, [initialSettings]);

  const handleChange = (field: keyof TradingSessionSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleTradingDayToggle = (day: TradingDay) => {
    const currentDays = settings.trading_days || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    handleChange('trading_days', newDays);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Risk Management Validation
    if (settings.stop_loss_percentage !== null && settings.stop_loss_percentage !== undefined) {
      if (settings.stop_loss_percentage < 0 || settings.stop_loss_percentage > 100) {
        newErrors.stop_loss_percentage = 'Must be between 0 and 100';
      }
    }

    if (settings.take_profit_percentage !== null && settings.take_profit_percentage !== undefined) {
      if (settings.take_profit_percentage < 0 || settings.take_profit_percentage > 100) {
        newErrors.take_profit_percentage = 'Must be between 0 and 100';
      }
    }

    if (settings.max_position_size_percentage !== undefined) {
      if (settings.max_position_size_percentage < 0 || settings.max_position_size_percentage > 100) {
        newErrors.max_position_size_percentage = 'Must be between 0 and 100';
      }
    }

    if (settings.max_daily_loss_percentage !== null && settings.max_daily_loss_percentage !== undefined) {
      if (settings.max_daily_loss_percentage < 0 || settings.max_daily_loss_percentage > 100) {
        newErrors.max_daily_loss_percentage = 'Must be between 0 and 100';
      }
    }

    if (settings.max_daily_loss_absolute !== null && settings.max_daily_loss_absolute !== undefined) {
      if (settings.max_daily_loss_absolute < 0) {
        newErrors.max_daily_loss_absolute = 'Must be positive';
      }
    }

    // Trading Hours Validation
    if (settings.trading_hours_start && !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(settings.trading_hours_start)) {
      newErrors.trading_hours_start = 'Must be in HH:mm format (24-hour)';
    }

    if (settings.trading_hours_end && !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(settings.trading_hours_end)) {
      newErrors.trading_hours_end = 'Must be in HH:mm format (24-hour)';
    }

    if (settings.trading_hours_start && settings.trading_hours_end) {
      const start = settings.trading_hours_start.split(':').map(Number);
      const end = settings.trading_hours_end.split(':').map(Number);
      const startMinutes = start[0] * 60 + start[1];
      const endMinutes = end[0] * 60 + end[1];
      if (startMinutes >= endMinutes) {
        newErrors.trading_hours_end = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    try {
      await onSubmit(settings);
    } catch (error) {
      console.error('Error submitting settings:', error);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <Settings sx={{ mr: 1 }} />
          <Typography variant="h6">Trading Session Settings</Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          {/* Risk Management Section */}
          <Accordion expanded={expandedSection === 'risk'} onChange={(_, isExpanded) => setExpandedSection(isExpanded ? 'risk' : false)}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center">
                <Security sx={{ mr: 1 }} />
                <Typography variant="subtitle1">Risk Management</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Stop Loss %"
                    type="number"
                    value={settings.stop_loss_percentage ?? ''}
                    onChange={(e) => handleChange('stop_loss_percentage', e.target.value ? parseFloat(e.target.value) : null)}
                    error={!!errors.stop_loss_percentage}
                    helperText={errors.stop_loss_percentage || 'Automatically close positions at this loss %'}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Take Profit %"
                    type="number"
                    value={settings.take_profit_percentage ?? ''}
                    onChange={(e) => handleChange('take_profit_percentage', e.target.value ? parseFloat(e.target.value) : null)}
                    error={!!errors.take_profit_percentage}
                    helperText={errors.take_profit_percentage || 'Automatically close positions at this profit %'}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Max Position Size %"
                    type="number"
                    value={settings.max_position_size_percentage ?? 25}
                    onChange={(e) => handleChange('max_position_size_percentage', parseFloat(e.target.value))}
                    error={!!errors.max_position_size_percentage}
                    helperText={errors.max_position_size_percentage || 'Maximum % of portfolio per position'}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Max Daily Loss %"
                    type="number"
                    value={settings.max_daily_loss_percentage ?? ''}
                    onChange={(e) => handleChange('max_daily_loss_percentage', e.target.value ? parseFloat(e.target.value) : null)}
                    error={!!errors.max_daily_loss_percentage}
                    helperText={errors.max_daily_loss_percentage || 'Stop session if daily loss exceeds this %'}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Max Daily Loss ($)"
                    type="number"
                    value={settings.max_daily_loss_absolute ?? ''}
                    onChange={(e) => handleChange('max_daily_loss_absolute', e.target.value ? parseFloat(e.target.value) : null)}
                    error={!!errors.max_daily_loss_absolute}
                    helperText={errors.max_daily_loss_absolute || 'Stop session if daily loss exceeds this amount'}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Order Execution Section */}
          <Accordion expanded={expandedSection === 'execution'} onChange={(_, isExpanded) => setExpandedSection(isExpanded ? 'execution' : false)}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center">
                <ShoppingCart sx={{ mr: 1 }} />
                <Typography variant="subtitle1">Order Execution</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Time in Force</InputLabel>
                    <Select
                      value={settings.time_in_force ?? 'day'}
                      onChange={(e) => handleChange('time_in_force', e.target.value as TimeInForce)}
                      label="Time in Force"
                    >
                      <MenuItem value="day">Day</MenuItem>
                      <MenuItem value="gtc">Good Till Canceled</MenuItem>
                      <MenuItem value="opg">Opening Auction</MenuItem>
                      <MenuItem value="cls">Closing Auction</MenuItem>
                      <MenuItem value="ioc">Immediate or Cancel</MenuItem>
                      <MenuItem value="fok">Fill or Kill</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Order Type</InputLabel>
                    <Select
                      value={settings.order_type_default ?? 'market'}
                      onChange={(e) => handleChange('order_type_default', e.target.value as OrderType)}
                      label="Order Type"
                    >
                      <MenuItem value="market">Market</MenuItem>
                      <MenuItem value="limit">Limit</MenuItem>
                      <MenuItem value="stop">Stop</MenuItem>
                      <MenuItem value="stop_limit">Stop Limit</MenuItem>
                      <MenuItem value="trailing_stop">Trailing Stop</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.allow_partial_fills ?? true}
                        onChange={(e) => handleChange('allow_partial_fills', e.target.checked)}
                      />
                    }
                    label="Allow Partial Fills"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.extended_hours ?? false}
                        onChange={(e) => handleChange('extended_hours', e.target.checked)}
                      />
                    }
                    label="Extended Hours Trading"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Limit Price Offset %"
                    type="number"
                    value={settings.limit_price_offset_percentage ?? ''}
                    onChange={(e) => handleChange('limit_price_offset_percentage', e.target.value ? parseFloat(e.target.value) : null)}
                    helperText="Offset from market price for limit orders"
                    inputProps={{ min: -100, max: 100, step: 0.1 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Position Management Section */}
          <Accordion expanded={expandedSection === 'position'} onChange={(_, isExpanded) => setExpandedSection(isExpanded ? 'position' : false)}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center">
                <Tune sx={{ mr: 1 }} />
                <Typography variant="subtitle1">Position Management</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Max Open Positions"
                    type="number"
                    value={settings.max_open_positions ?? 10}
                    onChange={(e) => handleChange('max_open_positions', parseInt(e.target.value))}
                    inputProps={{ min: 1 }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Position Sizing Method</InputLabel>
                    <Select
                      value={settings.position_sizing_method ?? 'percentage'}
                      onChange={(e) => handleChange('position_sizing_method', e.target.value as PositionSizingMethod)}
                      label="Position Sizing Method"
                    >
                      <MenuItem value="fixed">Fixed Amount</MenuItem>
                      <MenuItem value="percentage">Percentage</MenuItem>
                      <MenuItem value="kelly">Kelly Criterion</MenuItem>
                      <MenuItem value="equal_weight">Equal Weight</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Position Size Value"
                    type="number"
                    value={settings.position_size_value ?? 10.0}
                    onChange={(e) => handleChange('position_size_value', parseFloat(e.target.value))}
                    helperText={settings.position_sizing_method === 'percentage' ? 'Percentage of portfolio' : 'Dollar amount'}
                    inputProps={{ min: 0, step: 0.01 }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Rebalance Frequency</InputLabel>
                    <Select
                      value={settings.rebalance_frequency ?? 'never'}
                      onChange={(e) => handleChange('rebalance_frequency', e.target.value as RebalanceFrequency)}
                      label="Rebalance Frequency"
                    >
                      <MenuItem value="never">Never</MenuItem>
                      <MenuItem value="daily">Daily</MenuItem>
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="on_signal">On Signal</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Trading Window Section */}
          <Accordion expanded={expandedSection === 'window'} onChange={(_, isExpanded) => setExpandedSection(isExpanded ? 'window' : false)}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center">
                <Schedule sx={{ mr: 1 }} />
                <Typography variant="subtitle1">Trading Window</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Trading Hours Start (UTC)"
                    type="time"
                    value={settings.trading_hours_start ?? '09:30'}
                    onChange={(e) => handleChange('trading_hours_start', e.target.value)}
                    error={!!errors.trading_hours_start}
                    helperText={errors.trading_hours_start || 'Start time in HH:mm format (UTC)'}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Trading Hours End (UTC)"
                    type="time"
                    value={settings.trading_hours_end ?? '16:00'}
                    onChange={(e) => handleChange('trading_hours_end', e.target.value)}
                    error={!!errors.trading_hours_end}
                    helperText={errors.trading_hours_end || 'End time in HH:mm format (UTC)'}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormLabel component="legend">Trading Days</FormLabel>
                  <Stack direction="row" spacing={1} mt={1} flexWrap="wrap" gap={1}>
                    {TRADING_DAYS.map((day) => (
                      <Chip
                        key={day}
                        label={day}
                        onClick={() => handleTradingDayToggle(day)}
                        color={settings.trading_days?.includes(day) ? 'primary' : 'default'}
                        variant={settings.trading_days?.includes(day) ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Stack>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Advanced Section */}
          <Accordion expanded={expandedSection === 'advanced'} onChange={(_, isExpanded) => setExpandedSection(isExpanded ? 'advanced' : false)}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center">
                <Tune sx={{ mr: 1 }} />
                <Typography variant="subtitle1">Advanced Settings</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enable_trailing_stop ?? false}
                        onChange={(e) => handleChange('enable_trailing_stop', e.target.checked)}
                      />
                    }
                    label="Enable Trailing Stop"
                  />
                </Grid>
                {settings.enable_trailing_stop && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Trailing Stop %"
                      type="number"
                      value={settings.trailing_stop_percentage ?? ''}
                      onChange={(e) => handleChange('trailing_stop_percentage', e.target.value ? parseFloat(e.target.value) : null)}
                      inputProps={{ min: 0, max: 100, step: 0.1 }}
                    />
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enable_bracket_orders ?? false}
                        onChange={(e) => handleChange('enable_bracket_orders', e.target.checked)}
                      />
                    }
                    label="Enable Bracket Orders"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enable_oco_orders ?? false}
                        onChange={(e) => handleChange('enable_oco_orders', e.target.checked)}
                      />
                    }
                    label="Enable OCO Orders"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Commission Rate"
                    type="number"
                    value={settings.commission_rate ?? 0.0}
                    onChange={(e) => handleChange('commission_rate', parseFloat(e.target.value))}
                    helperText="Commission rate per trade (e.g., 0.005 = 0.5%)"
                    inputProps={{ min: 0, step: 0.0001 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Slippage Model</InputLabel>
                    <Select
                      value={settings.slippage_model ?? 'none'}
                      onChange={(e) => handleChange('slippage_model', e.target.value as SlippageModel)}
                      label="Slippage Model"
                    >
                      <MenuItem value="none">None</MenuItem>
                      <MenuItem value="fixed">Fixed</MenuItem>
                      <MenuItem value="proportional">Proportional</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {settings.slippage_model !== 'none' && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Slippage Value"
                      type="number"
                      value={settings.slippage_value ?? 0.0}
                      onChange={(e) => handleChange('slippage_value', parseFloat(e.target.value))}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                )}
              </Grid>
            </AccordionDetails>
          </Accordion>

          <Divider sx={{ my: 3 }} />

          <Box display="flex" justifyContent="flex-end" gap={2}>
            {onCancel && (
              <Button onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              startIcon={<Save />}
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : submitLabel}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

