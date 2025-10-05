import React from 'react';
import { TextField, Box, Typography, Grid } from '@mui/material';
import { BacktestFormData } from '../Backtesting.types';

interface BreakoutParamsProps {
  formData: BacktestFormData;
  onInputChange: (field: keyof BacktestFormData, value: string | number) => void;
}

const BreakoutParams: React.FC<BreakoutParamsProps> = ({ formData, onInputChange }) => {
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Breakout Strategy Parameters
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Support/Resistance Level Detection
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Lookback Window (days)"
            type="number"
            value={formData.lookbackWindow}
            onChange={(e) => onInputChange('lookbackWindow', parseInt(e.target.value) || 20)}
            inputProps={{ min: 10, max: 100 }}
            helperText="Period to identify support/resistance levels"
          />
        </Grid>
        
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Breakout Threshold (%)"
            type="number"
            value={formData.breakoutThreshold * 100}
            onChange={(e) => onInputChange('breakoutThreshold', parseFloat(e.target.value) / 100 || 0.01)}
            inputProps={{ min: 0.5, max: 5, step: 0.1 }}
            helperText="Minimum price move to confirm breakout"
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
            Volume Confirmation & Position Management
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Minimum Volume Ratio"
            type="number"
            value={formData.minVolumeRatio}
            onChange={(e) => onInputChange('minVolumeRatio', parseFloat(e.target.value) || 1.5)}
            inputProps={{ min: 1.0, max: 3.0, step: 0.1 }}
            helperText="Volume must be X times above average"
          />
        </Grid>
        
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Confirmation Period (days)"
            type="number"
            value={formData.confirmationPeriod}
            onChange={(e) => onInputChange('confirmationPeriod', parseInt(e.target.value) || 2)}
            inputProps={{ min: 1, max: 10 }}
            helperText="Days to hold position after breakout"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default BreakoutParams;
