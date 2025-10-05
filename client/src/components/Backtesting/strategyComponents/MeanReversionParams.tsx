import React from 'react';
import { TextField, Box, Typography } from '@mui/material';
import { BacktestFormData } from '../Backtesting.types';

interface MeanReversionParamsProps {
  formData: BacktestFormData;
  onInputChange: (field: keyof BacktestFormData, value: string | number) => void;
}

const MeanReversionParams: React.FC<MeanReversionParamsProps> = ({ formData, onInputChange }) => {
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Mean Reversion Parameters
      </Typography>
      
      <TextField
        fullWidth
        label="Moving Average Window (days)"
        type="number"
        value={formData.window}
        onChange={(e) => onInputChange('window', parseInt(e.target.value) || 20)}
        inputProps={{ min: 5, max: 200 }}
        helperText="Number of days to calculate the moving average"
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Threshold (%)"
        type="number"
        value={formData.threshold * 100}
        onChange={(e) => onInputChange('threshold', parseFloat(e.target.value) / 100 || 0.05)}
        inputProps={{ min: 1, max: 20, step: 0.1 }}
        helperText="Percentage deviation from moving average to trigger buy/sell signals"
      />
    </Box>
  );
};

export default MeanReversionParams;
