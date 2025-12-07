import React from 'react';
import { TextField, Box, Typography, Grid } from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';
import { BacktestFormData } from '../Backtesting.types';

const MomentumParams: React.FC = () => {
  const { control } = useFormContext<BacktestFormData>();
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
          <Controller
            name="rsiWindow"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="RSI Window (days)"
                type="number"
                inputProps={{ min: 5, max: 50 }}
                helperText="RSI calculation period"
                onChange={(e) => field.onChange(parseInt(e.target.value) || 14)}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={6}>
          <Controller
            name="rsiOversold"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="RSI Oversold Threshold"
                type="number"
                inputProps={{ min: 10, max: 40 }}
                helperText="RSI level considered oversold"
                onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={6}>
          <Controller
            name="rsiOverbought"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="RSI Overbought Threshold"
                type="number"
                inputProps={{ min: 60, max: 90 }}
                helperText="RSI level considered overbought"
                onChange={(e) => field.onChange(parseInt(e.target.value) || 70)}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
            Price Momentum Settings
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Controller
            name="momentumWindow"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Momentum Window (days)"
                type="number"
                inputProps={{ min: 5, max: 30 }}
                helperText="Period for momentum calculation"
                onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={6}>
          <Controller
            name="momentumThreshold"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Momentum Threshold (%)"
                type="number"
                value={(field.value ?? 0) * 100}
                onChange={(e) => field.onChange(parseFloat(e.target.value) / 100 || 0.02)}
                inputProps={{ min: 1, max: 10, step: 0.1 }}
                helperText="Minimum momentum percentage for signals"
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default MomentumParams;
