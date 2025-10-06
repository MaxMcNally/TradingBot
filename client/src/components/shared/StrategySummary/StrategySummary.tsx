import React from 'react';
import {
  Box,
  Paper,
  Typography,
} from '@mui/material';
import { StrategySummaryProps } from './types';

const StrategySummary: React.FC<StrategySummaryProps> = ({
  title = "Strategy Summary",
  selectedStrategy,
  strategyParameters,
  showParameters = true,
  compact = false,
}) => {
  const formatParameterValue = (value: any): string => {
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <Paper sx={{ p: 2, height: 'fit-content' }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        Current strategy: <strong>{selectedStrategy}</strong>
      </Typography>

      {showParameters && Object.keys(strategyParameters).length > 0 && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Parameters:
          </Typography>
          {Object.entries(strategyParameters).map(([key, value]) => (
            <Box key={key} display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2">{key}:</Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatParameterValue(value)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default StrategySummary;
