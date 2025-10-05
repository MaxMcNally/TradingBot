import React from 'react';
import { TextField, Box, Typography, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import { BacktestFormData } from '../Backtesting.types';

interface BollingerBandsParamsProps {
  formData: BacktestFormData;
  onInputChange: (field: keyof BacktestFormData, value: string | number) => void;
}

const BollingerBandsParams: React.FC<BollingerBandsParamsProps> = ({ formData, onInputChange }) => {
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Bollinger Bands Parameters
      </Typography>
      
      <TextField
        fullWidth
        label="Moving Average Window (days)"
        type="number"
        value={formData.window}
        onChange={(e) => onInputChange('window', parseInt(e.target.value) || 20)}
        inputProps={{ min: 5, max: 50 }}
        helperText="Number of days for the middle band (moving average)"
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Standard Deviation Multiplier"
        type="number"
        value={formData.multiplier}
        onChange={(e) => onInputChange('multiplier', parseFloat(e.target.value) || 2.0)}
        inputProps={{ min: 1.0, max: 3.0, step: 0.1 }}
        helperText="Multiplier for standard deviation to create upper/lower bands"
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

export default BollingerBandsParams;
