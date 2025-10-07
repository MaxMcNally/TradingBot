import React from 'react';
import { TextField, Box, Typography, Grid } from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';
import { BacktestFormData } from '../Backtesting.types';

const BreakoutParams: React.FC = () => {
  const { control } = useFormContext<BacktestFormData>();
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
          <Controller
            name="lookbackWindow"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Lookback Window (days)"
                type="number"
                inputProps={{ min: 10, max: 100 }}
                helperText="Period to identify support/resistance levels"
                onChange={(e) => field.onChange(parseInt(e.target.value) || 20)}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={6}>
          <Controller
            name="breakoutThreshold"
            control={control}
            render={({ field }) => (
              <TextField
                fullWidth
                label="Breakout Threshold (%)"
                type="number"
                value={(field.value ?? 0) * 100}
                onChange={(e) => field.onChange(parseFloat(e.target.value) / 100 || 0.01)}
                inputProps={{ min: 0.5, max: 5, step: 0.1 }}
                helperText="Minimum price move to confirm breakout"
              />
            )}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
            Volume Confirmation & Position Management
          </Typography>
        </Grid>
        
        <Grid item xs={6}>
          <Controller
            name="minVolumeRatio"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Minimum Volume Ratio"
                type="number"
                inputProps={{ min: 1.0, max: 3.0, step: 0.1 }}
                helperText="Volume must be X times above average"
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 1.5)}
              />
            )}
          />
        </Grid>
        
        <Grid item xs={6}>
          <Controller
            name="confirmationPeriod"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Confirmation Period (days)"
                type="number"
                inputProps={{ min: 1, max: 10 }}
                helperText="Days to hold position after breakout"
                onChange={(e) => field.onChange(parseInt(e.target.value) || 2)}
              />
            )}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default BreakoutParams;
