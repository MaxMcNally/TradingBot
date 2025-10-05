import React from 'react';
import { TextField, Box, Typography, Grid } from '@mui/material';
import { BacktestFormData } from '../Backtesting.types';

interface MomentumParamsProps {
  formData: BacktestFormData;
  onInputChange: (field: keyof BacktestFormData, value: string | number) => void;
}

const MomentumParams: React.FC<MomentumParamsProps> = ({ formData, onInputChange }) => {
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Momentum Strategy Parameters
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            RSI (Relative Strength Index) Settings
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="RSI Window (days)"
            type="number"
            value={formData.rsiWindow}
            onChange={(e) => onInputChange('rsiWindow', parseInt(e.target.value) || 14)}
            inputProps={{ min: 5, max: 50 }}
            helperText="RSI calculation period"
          />
        </Grid>
        
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="RSI Oversold Threshold"
            type="number"
            value={formData.rsiOversold}
            onChange={(e) => onInputChange('rsiOversold', parseInt(e.target.value) || 30)}
            inputProps={{ min: 10, max: 40 }}
            helperText="RSI level considered oversold"
          />
        </Grid>
        
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="RSI Overbought Threshold"
            type="number"
            value={formData.rsiOverbought}
            onChange={(e) => onInputChange('rsiOverbought', parseInt(e.target.value) || 70)}
            inputProps={{ min: 60, max: 90 }}
            helperText="RSI level considered overbought"
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
            Price Momentum Settings
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Momentum Window (days)"
            type="number"
            value={formData.momentumWindow}
            onChange={(e) => onInputChange('momentumWindow', parseInt(e.target.value) || 10)}
            inputProps={{ min: 5, max: 30 }}
            helperText="Period for momentum calculation"
          />
        </Grid>
        
        <Grid item xs={6}>
          <TextField
            fullWidth
            label="Momentum Threshold (%)"
            type="number"
            value={formData.momentumThreshold * 100}
            onChange={(e) => onInputChange('momentumThreshold', parseFloat(e.target.value) / 100 || 0.02)}
            inputProps={{ min: 1, max: 10, step: 0.1 }}
            helperText="Minimum momentum percentage for signals"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MomentumParams;
