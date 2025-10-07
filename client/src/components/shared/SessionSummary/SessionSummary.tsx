import React from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  TrendingUp,
} from '@mui/icons-material';
import { SessionSummaryProps } from './types';

const SessionSummary: React.FC<SessionSummaryProps> = ({
  title = "Session Configuration",
  selectedStocks = [],
  selectedStrategy,
  strategyParameters = {},
  mode = 'trading', // 'trading' or 'backtesting'
  showStocks = true,
  showStrategy = true,
  showParameters = true,
  maxStocks = 10,
}) => {
  // Check completion status
  const stocksSelected = selectedStocks.length > 0;
  const strategySelected = !!selectedStrategy;
  const parametersConfigured = Object.keys(strategyParameters).length > 0;
  
  // Calculate overall completion
  const totalSteps = [showStocks, showStrategy, showParameters].filter(Boolean).length;
  const completedSteps = [stocksSelected, strategySelected, parametersConfigured].filter(Boolean).length;
  const isComplete = completedSteps === totalSteps;

  const getStepIcon = (completed: boolean) => {
    return completed ? (
      <CheckCircle color="success" />
    ) : (
      <RadioButtonUnchecked color="disabled" />
    );
  };

  const getStepText = (completed: boolean, text: string) => {
    return (
      <Typography
        variant="body2"
        color={completed ? 'text.primary' : 'text.secondary'}
        sx={{ textDecoration: completed ? 'none' : 'line-through' }}
      >
        {text}
      </Typography>
    );
  };

  const formatParameterValue = (value: any): string => {
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  };

  return (
    <Paper sx={{ p: 2, height: 'fit-content' }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        {isComplete 
          ? `✅ Configuration complete (${completedSteps}/${totalSteps} steps)`
          : `Configure your ${mode} session (${completedSteps}/${totalSteps} steps)`
        }
      </Typography>

      <List dense>
        {showStocks && (
          <>
            <ListItem>
              <ListItemIcon>
                {getStepIcon(stocksSelected)}
              </ListItemIcon>
              <ListItemText
                primary={getStepText(stocksSelected, "Select Stocks")}
                secondary={
                  stocksSelected ? (
                    `Selected ${selectedStocks.length} stocks: ${selectedStocks.slice(0, 3).join(', ')}${selectedStocks.length > 3 ? ` +${selectedStocks.length - 3} more` : ''}`
                  ) : (
                    `Choose up to ${maxStocks} stocks for ${mode}`
                  )
                }
              />
            </ListItem>
            <Divider />
          </>
        )}

        {showStrategy && (
          <>
            <ListItem>
              <ListItemIcon>
                {getStepIcon(strategySelected)}
              </ListItemIcon>
              <ListItemText
                primary={getStepText(strategySelected, "Select Strategy")}
                secondary={
                  strategySelected ? (
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      <TrendingUp color="primary" fontSize="small" />
                      <Typography variant="body2" color="primary">
                        {selectedStrategy}
                      </Typography>
                    </Box>
                  ) : (
                    `Choose a trading strategy for ${mode}`
                  )
                }
              />
            </ListItem>
            <Divider />
          </>
        )}

        {showParameters && (
          <>
            <ListItem>
              <ListItemIcon>
                {getStepIcon(parametersConfigured)}
              </ListItemIcon>
              <ListItemText
                primary={getStepText(parametersConfigured, "Configure Parameters")}
                secondary={
                  parametersConfigured ? (
                    `Configured ${Object.keys(strategyParameters).length} parameters: ${Object.entries(strategyParameters).slice(0, 2).map(([key, value]) => `${key}: ${formatParameterValue(value)}`).join(', ')}${Object.keys(strategyParameters).length > 2 ? ` +${Object.keys(strategyParameters).length - 2} more` : ''}`
                  ) : (
                    strategySelected 
                      ? `Configure parameters for ${selectedStrategy}`
                      : "Select a strategy first to configure parameters"
                  )
                }
              />
            </ListItem>
          </>
        )}
      </List>

      {isComplete && (
        <Box mt={2} p={1} bgcolor="success.light" borderRadius={1}>
          <Typography variant="body2" color="success.contrastText" align="center">
            🎉 Ready to {mode === 'trading' ? 'start trading' : 'run backtest'}!
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default SessionSummary;
