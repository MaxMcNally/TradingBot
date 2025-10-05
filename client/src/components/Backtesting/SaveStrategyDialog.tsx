import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack
} from '@mui/material';
import {
  Save as SaveIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { BacktestFormData, BacktestResponse } from './Backtesting.types';
import { CreateStrategyData } from '../../api';

interface SaveStrategyDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateStrategyData) => Promise<void>;
  formData: BacktestFormData;
  results: BacktestResponse | null;
  isLoading: boolean;
}

const STRATEGY_TYPE_MAP: Record<string, string> = {
  'meanReversion': 'mean_reversion',
  'movingAverageCrossover': 'moving_average_crossover',
  'bollingerBands': 'bollinger_bands',
  'momentum': 'momentum',
  'breakout': 'breakout'
};

const STRATEGY_TYPE_LABELS: Record<string, string> = {
  'meanReversion': 'Mean Reversion',
  'movingAverageCrossover': 'Moving Average Crossover',
  'bollingerBands': 'Bollinger Bands',
  'momentum': 'Momentum',
  'breakout': 'Breakout'
};

const SaveStrategyDialog: React.FC<SaveStrategyDialogProps> = ({
  open,
  onClose,
  onSave,
  formData,
  results,
  isLoading
}) => {
  const [strategyName, setStrategyName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && formData && results) {
      // Generate a default name based on strategy and performance
      const strategyLabel = STRATEGY_TYPE_LABELS[formData.strategy] || formData.strategy;
      const totalReturn = results.data?.totalReturn || 0;
      const performanceIndicator = totalReturn > 0 ? 'Profitable' : 'Loss';
      const defaultName = `${strategyLabel} - ${performanceIndicator} (${new Date().toLocaleDateString()})`;
      
      setStrategyName(defaultName);
      setDescription(`Strategy saved from backtest results. ${strategyLabel} strategy tested on ${(formData.symbols || []).join(', ')} from ${formData.startDate} to ${formData.endDate}.`);
      setErrors({});
    }
  }, [open, formData, results]);

  const handleSave = async () => {
    if (!formData || !results) return;

    const newErrors: Record<string, string> = {};

    if (!strategyName.trim()) {
      newErrors.name = 'Strategy name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Build strategy configuration from form data
      const config = {
        strategy: formData.strategy,
        symbols: formData.symbols,
        startDate: formData.startDate,
        endDate: formData.endDate,
        initialCapital: formData.initialCapital,
        sharesPerTrade: formData.sharesPerTrade,
        // Strategy-specific parameters
        ...(formData.strategy === 'meanReversion' && {
          window: formData.window,
          threshold: formData.threshold
        }),
        ...(formData.strategy === 'movingAverageCrossover' && {
          fastWindow: formData.fastWindow,
          slowWindow: formData.slowWindow,
          maType: formData.maType
        }),
        ...(formData.strategy === 'momentum' && {
          rsiWindow: formData.rsiWindow,
          rsiOverbought: formData.rsiOverbought,
          rsiOversold: formData.rsiOversold,
          momentumWindow: formData.momentumWindow,
          momentumThreshold: formData.momentumThreshold
        }),
        ...(formData.strategy === 'bollingerBands' && {
          multiplier: formData.multiplier
        }),
        ...(formData.strategy === 'breakout' && {
          lookbackWindow: formData.lookbackWindow,
          breakoutThreshold: formData.breakoutThreshold,
          minVolumeRatio: formData.minVolumeRatio,
          confirmationPeriod: formData.confirmationPeriod
        })
      };

      const strategyData: CreateStrategyData = {
        name: strategyName.trim(),
        description: description.trim() || undefined,
        strategy_type: STRATEGY_TYPE_MAP[formData.strategy] || formData.strategy,
        config,
        backtest_results: results.data
      };

      await onSave(strategyData);
      onClose();
    } catch (error) {
      console.error('Error saving strategy:', error);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const formatPercentage = (value: number | undefined | null): string => {
    if (value === undefined || value === null || isNaN(value)) {
      return "0.00%";
    }
    return `${(value * 100).toFixed(2)}%`;
  };

  if (!formData || !results) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SaveIcon color="primary" />
          <Typography variant="h6">Save Strategy from Backtest</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {/* Strategy Performance Summary */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Backtest Performance
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Chip
                icon={<TrendingUpIcon />}
                label={`${formatPercentage(results.data?.totalReturn)} Return`}
                color={(results.data?.totalReturn || 0) > 0 ? 'success' : 'error'}
                variant="outlined"
              />
              <Chip
                icon={<AssessmentIcon />}
                label={`${formatPercentage(results.data?.winRate)} Win Rate`}
                variant="outlined"
              />
              <Chip
                label={`${results.data?.totalTrades || 0} Trades`}
                variant="outlined"
              />
              <Chip
                label={`$${(results.data?.finalPortfolioValue || 0).toLocaleString()}`}
                variant="outlined"
              />
            </Box>
          </Box>

          {/* Strategy Configuration Summary */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Strategy Configuration
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Chip
                icon={<PsychologyIcon />}
                label={STRATEGY_TYPE_LABELS[formData.strategy] || formData.strategy}
                color="primary"
                variant="outlined"
              />
              <Chip
                label={`${(formData.symbols || []).join(', ')}`}
                variant="outlined"
              />
              <Chip
                label={`${formData.startDate} to ${formData.endDate}`}
                variant="outlined"
              />
              <Chip
                label={`$${(formData.initialCapital || 0).toLocaleString()} Capital`}
                variant="outlined"
              />
            </Box>
          </Box>

          {/* Form Fields */}
          <TextField
            label="Strategy Name"
            value={strategyName}
            onChange={(e) => {
              setStrategyName(e.target.value);
              if (errors.name) {
                setErrors(prev => ({ ...prev, name: '' }));
              }
            }}
            error={!!errors.name}
            helperText={errors.name || 'Give your strategy a memorable name'}
            fullWidth
            required
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            fullWidth
            helperText="Optional description of your strategy"
          />

          <Alert severity="info">
            <Typography variant="body2">
              This strategy will be saved with the current configuration and backtest results. 
              You can edit it later from the Strategies page.
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          Save Strategy
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveStrategyDialog;
