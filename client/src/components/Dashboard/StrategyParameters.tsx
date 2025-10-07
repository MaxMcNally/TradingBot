import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Button,
  Alert,
} from "@mui/material";
import { Settings, Save } from "@mui/icons-material";

interface StrategyParametersProps {
  selectedStrategy: string;
  strategyParameters: Record<string, any>;
  onParametersChange: (parameters: Record<string, any>) => void;
}

const StrategyParameters: React.FC<StrategyParametersProps> = ({
  selectedStrategy,
  strategyParameters,
  onParametersChange,
}) => {
  const [localParameters, setLocalParameters] = useState<Record<string, any>>(strategyParameters);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset parameters when strategy changes
  useEffect(() => {
    const defaultParams: Record<string, any> = {};
    
    switch (selectedStrategy) {
      case 'sentimentAnalysis':
      case 'SentimentAnalysis':
        defaultParams.lookbackDays = 3;
        defaultParams.pollIntervalMinutes = 0;
        defaultParams.minArticles = 2;
        defaultParams.buyThreshold = 0.4;
        defaultParams.sellThreshold = -0.4;
        defaultParams.titleWeight = 2.0;
        defaultParams.recencyHalfLifeHours = 12;
        // newsSource is backend-controlled; do not expose toggle in client
        break;
      case 'meanReversion':
      case 'MeanReversion':
        defaultParams.window = 20;
        defaultParams.threshold = 0.05;
        break;
      case 'movingAverage':
      case 'MovingAverage':
        defaultParams.shortWindow = 5;
        defaultParams.longWindow = 10;
        break;
      case 'movingAverageCrossover':
        defaultParams.fastWindow = 10;
        defaultParams.slowWindow = 30;
        defaultParams.maType = 'SMA';
        break;
      case 'momentum':
      case 'Momentum':
        defaultParams.rsiWindow = 14;
        defaultParams.rsiOverbought = 70;
        defaultParams.rsiOversold = 30;
        break;
      case 'bollingerBands':
      case 'BollingerBands':
        defaultParams.window = 20;
        defaultParams.multiplier = 2.0;
        break;
      case 'breakout':
      case 'Breakout':
        defaultParams.lookbackWindow = 20;
        defaultParams.breakoutThreshold = 0.01;
        break;
      default:
        break;
    }
    
    setLocalParameters(defaultParams);
    setHasChanges(false);
  }, [selectedStrategy]);

  // Check for changes
  useEffect(() => {
    const hasChanges = JSON.stringify(localParameters) !== JSON.stringify(strategyParameters);
    setHasChanges(hasChanges);
  }, [localParameters, strategyParameters]);

  const handleParameterChange = (key: string, value: any) => {
    setLocalParameters(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onParametersChange(localParameters);
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalParameters(strategyParameters);
    setHasChanges(false);
  };

  const renderParameterInputs = () => {
    switch (selectedStrategy) {
      case 'sentimentAnalysis':
      case 'SentimentAnalysis':
        return (
          <Stack spacing={2}>
            <TextField
              label="Lookback Days"
              type="number"
              value={localParameters.lookbackDays || 3}
              onChange={(e) => handleParameterChange('lookbackDays', parseInt(e.target.value))}
              size="small"
              fullWidth
              inputProps={{ min: 1, max: 30 }}
            />
            <TextField
              label="Min Articles"
              type="number"
              value={localParameters.minArticles || 2}
              onChange={(e) => handleParameterChange('minArticles', parseInt(e.target.value))}
              size="small"
              fullWidth
              inputProps={{ min: 1, max: 50 }}
            />
            <TextField
              label="Buy Threshold"
              type="number"
              inputProps={{ step: '0.05', min: 0, max: 1 }}
              value={localParameters.buyThreshold ?? 0.4}
              onChange={(e) => handleParameterChange('buyThreshold', parseFloat(e.target.value))}
              size="small"
              fullWidth
            />
            <TextField
              label="Sell Threshold"
              type="number"
              inputProps={{ step: '0.05', min: -1, max: 0 }}
              value={localParameters.sellThreshold ?? -0.4}
              onChange={(e) => handleParameterChange('sellThreshold', parseFloat(e.target.value))}
              size="small"
              fullWidth
            />
            <TextField
              label="Title Weight"
              type="number"
              inputProps={{ step: '0.1', min: 0.5, max: 5 }}
              value={localParameters.titleWeight ?? 2.0}
              onChange={(e) => handleParameterChange('titleWeight', parseFloat(e.target.value))}
              size="small"
              fullWidth
            />
            <TextField
              label="Recency Half-Life (hours)"
              type="number"
              value={localParameters.recencyHalfLifeHours ?? 12}
              onChange={(e) => handleParameterChange('recencyHalfLifeHours', parseInt(e.target.value))}
              size="small"
              fullWidth
              inputProps={{ min: 1, max: 72 }}
            />
            {/* newsSource is backend-controlled; do not render a control */}
          </Stack>
        );
      case 'meanReversion':
      case 'MeanReversion':
        return (
          <Stack spacing={2}>
            <TextField
              label="Window"
              type="number"
              value={localParameters.window || 20}
              onChange={(e) => handleParameterChange('window', parseInt(e.target.value))}
              size="small"
              fullWidth
              helperText="Number of periods for mean calculation"
              inputProps={{ min: 5, max: 200 }}
            />
            <TextField
              label="Threshold"
              type="number"
              inputProps={{ step: "0.01", min: 0.01, max: 0.2 }}
              value={localParameters.threshold || 0.05}
              onChange={(e) => handleParameterChange('threshold', parseFloat(e.target.value))}
              size="small"
              fullWidth
              helperText="Number of standard deviations for signal generation"
            />
          </Stack>
        );

      case 'movingAverage':
      case 'MovingAverage':
        return (
          <Stack spacing={2}>
            <TextField
              label="Short Window"
              type="number"
              value={localParameters.shortWindow || 5}
              onChange={(e) => handleParameterChange('shortWindow', parseInt(e.target.value))}
              size="small"
              fullWidth
              helperText="Short-term moving average periods"
              inputProps={{ min: 2, max: 50 }}
            />
            <TextField
              label="Long Window"
              type="number"
              value={localParameters.longWindow || 10}
              onChange={(e) => handleParameterChange('longWindow', parseInt(e.target.value))}
              size="small"
              fullWidth
              helperText="Long-term moving average periods"
              inputProps={{ min: 5, max: 200 }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>MA Type</InputLabel>
              <Select
                value={localParameters.maType || 'SMA'}
                onChange={(e) => handleParameterChange('maType', e.target.value)}
                label="MA Type"
              >
                <MenuItem value="SMA">Simple Moving Average</MenuItem>
                <MenuItem value="EMA">Exponential Moving Average</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        );

      case 'movingAverageCrossover':
        return (
          <Stack spacing={2}>
            <TextField
              label="Fast Window"
              type="number"
              value={localParameters.fastWindow || 10}
              onChange={(e) => handleParameterChange('fastWindow', parseInt(e.target.value))}
              size="small"
              fullWidth
              helperText="Fast moving average window in days"
              inputProps={{ min: 5, max: 50 }}
            />
            <TextField
              label="Slow Window"
              type="number"
              value={localParameters.slowWindow || 30}
              onChange={(e) => handleParameterChange('slowWindow', parseInt(e.target.value))}
              size="small"
              fullWidth
              helperText="Slow moving average window in days"
              inputProps={{ min: 10, max: 200 }}
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Moving Average Type</InputLabel>
              <Select
                value={localParameters.maType || 'SMA'}
                onChange={(e) => handleParameterChange('maType', e.target.value)}
                label="Moving Average Type"
              >
                <MenuItem value="SMA">Simple Moving Average (SMA)</MenuItem>
                <MenuItem value="EMA">Exponential Moving Average (EMA)</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        );

      case 'momentum':
      case 'Momentum':
        return (
          <Stack spacing={2}>
            <TextField
              label="RSI Window"
              type="number"
              value={localParameters.rsiWindow || 14}
              onChange={(e) => handleParameterChange('rsiWindow', parseInt(e.target.value))}
              size="small"
              fullWidth
              helperText="RSI calculation window in days"
              inputProps={{ min: 5, max: 50 }}
            />
            <TextField
              label="RSI Overbought"
              type="number"
              value={localParameters.rsiOverbought || 70}
              onChange={(e) => handleParameterChange('rsiOverbought', parseInt(e.target.value))}
              size="small"
              fullWidth
              helperText="RSI level considered overbought"
              inputProps={{ min: 60, max: 90 }}
            />
            <TextField
              label="RSI Oversold"
              type="number"
              value={localParameters.rsiOversold || 30}
              onChange={(e) => handleParameterChange('rsiOversold', parseInt(e.target.value))}
              size="small"
              fullWidth
              helperText="RSI level considered oversold"
              inputProps={{ min: 10, max: 40 }}
            />
          </Stack>
        );

      case 'bollingerBands':
      case 'BollingerBands':
        return (
          <Stack spacing={2}>
            <TextField
              label="Window"
              type="number"
              value={localParameters.window || 20}
              onChange={(e) => handleParameterChange('window', parseInt(e.target.value))}
              size="small"
              fullWidth
              helperText="Moving average window for Bollinger Bands"
              inputProps={{ min: 5, max: 50 }}
            />
            <TextField
              label="Multiplier"
              type="number"
              inputProps={{ step: "0.1", min: 1.0, max: 3.0 }}
              value={localParameters.multiplier || 2.0}
              onChange={(e) => handleParameterChange('multiplier', parseFloat(e.target.value))}
              size="small"
              fullWidth
              helperText="Standard deviation multiplier for bands"
            />
          </Stack>
        );

      case 'breakout':
      case 'Breakout':
        return (
          <Stack spacing={2}>
            <TextField
              label="Lookback Window"
              type="number"
              value={localParameters.lookbackWindow || 20}
              onChange={(e) => handleParameterChange('lookbackWindow', parseInt(e.target.value))}
              size="small"
              fullWidth
              helperText="Number of periods to look back for support/resistance"
              inputProps={{ min: 5, max: 100 }}
            />
            <TextField
              label="Breakout Threshold"
              type="number"
              inputProps={{ step: "0.01", min: 0.005, max: 0.05 }}
              value={localParameters.breakoutThreshold || 0.01}
              onChange={(e) => handleParameterChange('breakoutThreshold', parseFloat(e.target.value))}
              size="small"
              fullWidth
              helperText="Percentage threshold for breakout confirmation"
            />
          </Stack>
        );

      default:
        return (
          <Alert severity="info">
            No parameters available for the selected strategy.
          </Alert>
        );
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
          <Typography variant="h6">
            Strategy Parameters
          </Typography>
        </Box>
        
        <Typography variant="body2" color="textSecondary" paragraph>
          Configure the parameters for your selected strategy. These settings will determine how the strategy behaves during live trading.
        </Typography>

        <Box mb={3}>
          <Typography variant="subtitle2" gutterBottom>
            {selectedStrategy} Parameters
          </Typography>
          {renderParameterInputs()}
        </Box>

        <Box display="flex" gap={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={!hasChanges}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSave}
            disabled={!hasChanges}
          >
            Save Parameters
          </Button>
        </Box>

        {hasChanges && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            You have unsaved changes. Click "Save Parameters" to apply them.
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default StrategyParameters;
