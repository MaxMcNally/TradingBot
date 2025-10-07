import React from 'react';
import { TextField, Box, Typography } from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';
import { BacktestFormData } from '../Backtesting.types';

const MeanReversionParams: React.FC = () => {
  const { control } = useFormContext<BacktestFormData>();
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Mean Reversion Parameters
      </Typography>
      
      <Controller
        name="window"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Moving Average Window (days)"
            type="number"
            inputProps={{ min: 5, max: 200 }}
            helperText="Number of days to calculate the moving average"
            sx={{ mb: 2 }}
            onChange={(e) => field.onChange(parseInt(e.target.value) || 20)}
          />
        )}
      />

      <Controller
        name="threshold"
        control={control}
        render={({ field }) => (
          <TextField
            fullWidth
            label="Threshold (%)"
            type="number"
            value={(field.value ?? 0) * 100}
            onChange={(e) => field.onChange(parseFloat(e.target.value) / 100 || 0.05)}
            inputProps={{ min: 1, max: 20, step: 0.1 }}
            helperText="Percentage deviation from moving average to trigger buy/sell signals"
          />
        )}
      />
    </Box>
  );
};

export default MeanReversionParams;
