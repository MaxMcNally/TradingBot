import React from 'react';
import { TextField, Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';
import { BacktestFormData } from '../Backtesting.types';

const BollingerBandsParams: React.FC = () => {
  const { control } = useFormContext<BacktestFormData>();
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Bollinger Bands Parameters
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
            inputProps={{ min: 5, max: 50 }}
            helperText="Number of days for the middle band (moving average)"
            sx={{ mb: 2 }}
            onChange={(e) => field.onChange(parseInt(e.target.value) || 20)}
          />
        )}
      />

      <Controller
        name="multiplier"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Standard Deviation Multiplier"
            type="number"
            inputProps={{ min: 1.0, max: 3.0, step: 0.1 }}
            helperText="Multiplier for standard deviation to create upper/lower bands"
            sx={{ mb: 2 }}
            onChange={(e) => field.onChange(parseFloat(e.target.value) || 2.0)}
          />
        )}
      />

      <Controller
        name="maType"
        control={control}
        render={({ field }) => (
          <FormControl fullWidth>
            <InputLabel>Moving Average Type</InputLabel>
            <Select
              {...field}
              label="Moving Average Type"
              onChange={(e) => field.onChange(e.target.value)}
            >
              <MenuItem value="SMA">Simple Moving Average (SMA)</MenuItem>
              <MenuItem value="EMA">Exponential Moving Average (EMA)</MenuItem>
            </Select>
          </FormControl>
        )}
      />
    </Box>
  );
};

export default BollingerBandsParams;
