import React, { useEffect, useState } from 'react';
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
  Divider,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  IconButton,
  Tooltip,
  Stack,
  Paper
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  TrendingUp,
  ShowChart,
  CompareArrows,
  Speed,
  BarChart,
  Psychology
} from '@mui/icons-material';
import { StrategyDialogProps, StrategyFormData } from './Strategies.types';
import { RobotAvatarSelector } from '../../components/shared/RobotAvatars';
import StrategyParameters from '../../components/shared/StrategyParameters';

const STRATEGY_TYPES = [
  { 
    value: 'movingAverageCrossover', 
    label: 'Moving Average Crossover',
    icon: <CompareArrows />,
    description: 'A trend-following strategy that generates buy signals when a fast moving average crosses above a slow moving average, and sell signals when it crosses below. Best for trending markets.'
  },
  { 
    value: 'bollingerBands', 
    label: 'Bollinger Bands',
    icon: <BarChart />,
    description: 'Uses volatility bands to identify overbought and oversold conditions. Buys when price touches the lower band and sells when it reaches the upper band. Effective in ranging markets.'
  },
  { 
    value: 'meanReversion', 
    label: 'Mean Reversion',
    icon: <ShowChart />,
    description: 'Assumes prices will revert to their mean. Buys when price deviates significantly below the mean and sells when it returns. Works well in sideways markets.'
  },
  { 
    value: 'momentum', 
    label: 'Momentum',
    icon: <Speed />,
    description: 'Uses RSI and momentum indicators to identify strong price movements. Buys on momentum strength and sells on weakness. Ideal for volatile, trending markets.'
  },
  { 
    value: 'breakout', 
    label: 'Breakout',
    icon: <TrendingUp />,
    description: 'Identifies when price breaks through support or resistance levels with increased volume. Captures strong directional moves. Best for markets with clear support/resistance levels.'
  },
  { 
    value: 'sentimentAnalysis', 
    label: 'Sentiment Analysis',
    icon: <Psychology />,
    description: 'Analyzes news articles and social media sentiment to predict price movements. Buys on positive sentiment and sells on negative sentiment. Useful for stocks with high news coverage.'
  },
];

// Map strategy_type values to StrategyParameters config keys
const STRATEGY_TYPE_TO_CONFIG_KEY: Record<string, string> = {
  'movingAverageCrossover': 'MovingAverageCrossover',
  'bollingerBands': 'BollingerBands',
  'meanReversion': 'MeanReversion',
  'momentum': 'Momentum',
  'breakout': 'Breakout',
  'sentimentAnalysis': 'SentimentAnalysis',
};

const steps = ['Pick Strategy', 'Customize', 'Details'];

const StrategyDialog: React.FC<StrategyDialogProps> = ({
  open,
  onClose,
  strategy,
  onSave,
  isLoading
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedStrategyInfo, setSelectedStrategyInfo] = useState<string | null>(null);
  
  const methods = useForm<StrategyFormData>({
    defaultValues: {
      name: '',
      description: '',
      strategy_type: 'movingAverageCrossover',
      config: {},
      backtest_results: null,
      is_public: false,
      avatar: null,
    },
    mode: 'onChange',
  });
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = methods;

  useEffect(() => {
    if (open) {
      if (strategy) {
        reset({
          name: strategy.name || '',
          description: strategy.description || '',
          strategy_type: strategy.strategy_type || 'movingAverageCrossover',
          config: strategy.config || {},
          backtest_results: strategy.backtest_results || null,
          is_public: strategy.is_public || false,
          avatar: strategy.avatar || null,
        });
        setActiveStep(0);
      } else {
        reset({
          name: '',
          description: '',
          strategy_type: 'movingAverageCrossover',
          config: {},
          backtest_results: null,
          is_public: false,
          avatar: null,
        });
        setActiveStep(0);
      }
      setSelectedStrategyInfo(null);
    }
  }, [strategy, open, reset]);

  const handleNext = () => {
    if (activeStep === 0 && !watch('strategy_type')) {
      return; // Can't proceed without selecting a strategy
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };


  const onSubmit = (data: StrategyFormData) => {
    onSave(data);
  };

  const handleClose = () => {
    setActiveStep(0);
    setSelectedStrategyInfo(null);
    onClose();
  };

  const handleStrategySelect = (strategyType: string) => {
    setValue('strategy_type', strategyType as any);
    if (!strategy) {
      // Reset config when strategy type changes for new strategies
      const configKey = STRATEGY_TYPE_TO_CONFIG_KEY[strategyType];
      if (configKey) {
        setValue('config', {});
      }
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Pick Strategy
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Choose a Strategy Type
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Select a trading strategy that matches your trading style and market conditions.
            </Typography>
            <Grid container spacing={2} sx={{ mt: 2 }}>
              {STRATEGY_TYPES.map((strategyType) => {
                const isSelected = watch('strategy_type') === strategyType.value;
                return (
                  <Grid item xs={12} sm={6} md={4} key={strategyType.value}>
                    <Card
                      sx={{
                        height: '100%',
                        border: isSelected ? 2 : 1,
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        backgroundColor: isSelected ? 'action.selected' : 'background.paper',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: 2
                        }
                      }}
                    >
                      <CardActionArea onClick={() => handleStrategySelect(strategyType.value)}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ color: 'primary.main', fontSize: 32 }}>
                                {strategyType.icon}
                              </Box>
                              <Typography variant="h6" component="div">
                                {strategyType.label}
                              </Typography>
                            </Box>
                            <Tooltip title={strategyType.description} arrow>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStrategyInfo(
                                    selectedStrategyInfo === strategyType.value ? null : strategyType.value
                                  );
                                }}
                              >
                                <InfoIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                          {selectedStrategyInfo === strategyType.value && (
                            <Alert severity="info" sx={{ mt: 1 }}>
                              <Typography variant="body2">
                                {strategyType.description}
                              </Typography>
                            </Alert>
                          )}
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        );

      case 1: // Customize
        const configKey = watch('strategy_type') ? STRATEGY_TYPE_TO_CONFIG_KEY[watch('strategy_type')] : null;
        if (!configKey) {
          return (
            <Alert severity="warning">
              Please select a strategy type first.
            </Alert>
          );
        }
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Customize Strategy Parameters
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure the parameters for your {STRATEGY_TYPES.find(s => s.value === watch('strategy_type'))?.label} strategy. 
              Adjust these values based on your risk tolerance and market conditions.
            </Typography>
            <Box sx={{ mt: 2 }}>
              <StrategyParameters
                selectedStrategy={configKey}
                strategyParameters={watch('config') || {}}
                onParametersChange={(parameters) => setValue('config', parameters)}
                showSaveButton={false}
                showResetButton={false}
                compact={false}
                title=""
                description=""
              />
            </Box>
          </Box>
        );

      case 2: // Details
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Strategy Details
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Give your strategy a name, description, and choose an avatar to personalize it.
            </Typography>
            <Stack spacing={3} sx={{ mt: 2 }}>
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
                helperText="Describe what this strategy does and when it's best used"
              />

              <RobotAvatarSelector
                selectedAvatar={watch('avatar')}
                onAvatarSelect={(avatarNumber) => setValue('avatar', avatarNumber)}
                size={40}
              />

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

              {watch('backtest_results') && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Backtest Results
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'InfoBackground', 
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
            </Stack>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack spacing={2}>
          <Typography variant="h5">
            {strategy ? 'Edit Strategy' : 'Create New Strategy'}
          </Typography>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ minHeight: 400 }}>
        <FormProvider {...methods}>
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            {renderStepContent()}
          </Box>
        </FormProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Stack direction="row" spacing={2}>
          <Button
            disabled={activeStep === 0 || isLoading}
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
          >
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit(onSubmit)}
              variant="contained"
              disabled={isLoading || !watch('name')?.trim() || !watch('strategy_type')}
              startIcon={isLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            >
              {isLoading ? 'Saving...' : strategy ? 'Update' : 'Create'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={activeStep === 0 && !watch('strategy_type')}
              endIcon={<ArrowForwardIcon />}
            >
              Next
            </Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default StrategyDialog;
