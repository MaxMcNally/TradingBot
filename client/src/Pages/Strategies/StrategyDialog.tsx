import React, { useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
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
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Divider
} from '@mui/material';
import { StrategyDialogProps, StrategyFormData } from './Strategies.types';
import { RobotAvatarSelector } from '../../components/shared/RobotAvatars';

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
  const methods = useForm<StrategyFormData>({
    defaultValues: {
      name: '',
      description: '',
      strategy_type: 'moving_average_crossover',
      config: {},
      backtest_results: null,
      is_public: false,
      avatar: null,
    },
    mode: 'onChange',
  });
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = methods;

  useEffect(() => {
    if (strategy) {
      reset({
        name: strategy.name || '',
        description: strategy.description || '',
        strategy_type: strategy.strategy_type || 'moving_average_crossover',
        config: strategy.config || {},
        backtest_results: strategy.backtest_results || null,
        is_public: strategy.is_public || false,
        avatar: strategy.avatar || null,
      });
    } else {
      reset({
        name: '',
        description: '',
        strategy_type: 'moving_average_crossover',
        config: {},
        backtest_results: null,
        is_public: false,
        avatar: null,
      });
    }
  }, [strategy, open, reset]);

  const onSubmit = (data: StrategyFormData) => {
    onSave(data);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {strategy ? 'Edit Strategy' : 'Create New Strategy'}
      </DialogTitle>
      <DialogContent>
        <FormProvider {...methods}>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Strategy Name"
              {...register('name', { required: true })}
              error={!!errors.name}
              helperText={errors.name ? 'Strategy name is required' : ''}
              fullWidth
              required
            />

            <TextField
              label="Description"
              {...register('description')}
              multiline
              rows={3}
              fullWidth
            />

            <RobotAvatarSelector
              selectedAvatar={watch('avatar')}
              onAvatarSelect={(avatarNumber) => setValue('avatar', avatarNumber)}
              size={40}
            />

            <FormControl fullWidth error={!!errors.strategy_type}>
              <InputLabel>Strategy Type</InputLabel>
              <Select
                {...register('strategy_type', { required: true })}
                value={watch('strategy_type')}
                onChange={(e) => setValue('strategy_type', e.target.value as any)}
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
                  Strategy type is required
                </Typography>
              )}
            </FormControl>

            {watch('backtest_results') && (
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
                  {JSON.stringify(watch('backtest_results'), null, 2)}
                </Typography>
              </Box>
            </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <FormControlLabel
              control={
                <Checkbox
                  checked={!!watch('is_public')}
                  onChange={(e) => setValue('is_public', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body1" fontWeight="medium">
                    Make this strategy public
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Allow other users to discover and use this strategy for their trading. 
                    Public strategies will be visible to all users in the Public Strategies section.
                  </Typography>
                </Box>
              }
            />

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Strategy configuration will be set based on the strategy type selected. 
                You can modify the configuration after creating the strategy.
              </Typography>
            </Alert>
          </Box>
        </FormProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button 
          type="submit"
          onClick={handleSubmit(onSubmit)} 
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
