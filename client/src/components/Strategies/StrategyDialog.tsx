import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { StrategyDialogProps, StrategyFormData } from './Strategies.types';

const STRATEGY_TYPES = [
  { value: 'moving_average_crossover', label: 'Moving Average Crossover' },
  { value: 'bollinger_bands', label: 'Bollinger Bands' },
  { value: 'mean_reversion', label: 'Mean Reversion' },
  { value: 'momentum', label: 'Momentum' },
  { value: 'breakout', label: 'Breakout' },
];

const StrategyDialog: React.FC<StrategyDialogProps> = ({
  open,
  onClose,
  strategy,
  onSave,
  isLoading
}) => {
  const [formData, setFormData] = useState<StrategyFormData>({
    name: '',
    description: '',
    strategy_type: 'moving_average_crossover',
    config: {},
    backtest_results: null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (strategy) {
      setFormData({
        name: strategy.name || '',
        description: strategy.description || '',
        strategy_type: strategy.strategy_type || 'moving_average_crossover',
        config: strategy.config || {},
        backtest_results: strategy.backtest_results || null
      });
    } else {
      setFormData({
        name: '',
        description: '',
        strategy_type: 'moving_average_crossover',
        config: {},
        backtest_results: null
      });
    }
    setErrors({});
  }, [strategy, open]);

  const handleInputChange = (field: keyof StrategyFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Strategy name is required';
    }

    if (!formData.strategy_type) {
      newErrors.strategy_type = 'Strategy type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {strategy ? 'Edit Strategy' : 'Create New Strategy'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Strategy Name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            required
          />

          <TextField
            label="Description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            multiline
            rows={3}
            fullWidth
          />

          <FormControl fullWidth error={!!errors.strategy_type}>
            <InputLabel>Strategy Type</InputLabel>
            <Select
              value={formData.strategy_type}
              onChange={(e) => handleInputChange('strategy_type', e.target.value)}
              label="Strategy Type"
            >
              {STRATEGY_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
            {errors.strategy_type && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                {errors.strategy_type}
              </Typography>
            )}
          </FormControl>

          {formData.backtest_results && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Backtest Results
              </Typography>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.200'
              }}>
                <Typography variant="body2" component="pre" sx={{ 
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {JSON.stringify(formData.backtest_results, null, 2)}
                </Typography>
              </Box>
            </Box>
          )}

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Strategy configuration will be set based on the strategy type selected. 
              You can modify the configuration after creating the strategy.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
        >
          {strategy ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StrategyDialog;
