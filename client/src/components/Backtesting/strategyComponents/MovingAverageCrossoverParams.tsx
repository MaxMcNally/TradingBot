import React from 'react';
import { TextField, Box, Typography, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { BacktestFormData } from '../Backtesting.types';

interface MovingAverageCrossoverParamsProps {
  formData: BacktestFormData;
  onInputChange: (field: keyof BacktestFormData, value: string | number) => void;
}

const MovingAverageCrossoverParams: React.FC<MovingAverageCrossoverParamsProps> = ({ formData, onInputChange }) => {
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Moving Average Crossover Parameters
      </Typography>
      
      <TextField
        fullWidth
        label="Fast Moving Average Window (days)"
        type="number"
        value={formData.fastWindow}
        onChange={(e) => onInputChange('fastWindow', parseInt(e.target.value) || 10)}
        inputProps={{ min: 5, max: 50 }}
        helperText="Number of days for the fast moving average"
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Slow Moving Average Window (days)"
        type="number"
        value={formData.slowWindow}
        onChange={(e) => onInputChange('slowWindow', parseInt(e.target.value) || 30)}
        inputProps={{ min: 10, max: 200 }}
        helperText="Number of days for the slow moving average"
        sx={{ mb: 2 }}
      />

      <FormControl fullWidth>
        <InputLabel>Moving Average Type</InputLabel>
        <Select
          value={formData.maType}
          label="Moving Average Type"
          onChange={(e: SelectChangeEvent) => onInputChange('maType', e.target.value)}
        >
          <MenuItem value="SMA">Simple Moving Average (SMA)</MenuItem>
          <MenuItem value="EMA">Exponential Moving Average (EMA)</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};

export default MovingAverageCrossoverParams;
