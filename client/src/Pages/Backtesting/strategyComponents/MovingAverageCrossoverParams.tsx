import React from 'react';
import { TextField, Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useFormContext, Controller } from 'react-hook-form';
import { BacktestFormData } from '../Backtesting.types';

const MovingAverageCrossoverParams: React.FC = () => {
  const { control } = useFormContext<BacktestFormData>();
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Moving Average Crossover Parameters
      </Typography>

      <Controller
        name="fastWindow"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Fast Moving Average Window (days)"
            type="number"
            inputProps={{ min: 5, max: 50 }}
            helperText="Number of days for the fast moving average"
            sx={{ mb: 2 }}
            onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
          />
        )}
      />

      <Controller
        name="slowWindow"
        control={control}
        render={({ field }) => (
          <TextField
            {...field}
            fullWidth
            label="Slow Moving Average Window (days)"
            type="number"
            inputProps={{ min: 10, max: 200 }}
            helperText="Number of days for the slow moving average"
            sx={{ mb: 2 }}
            onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
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

export default MovingAverageCrossoverParams;
