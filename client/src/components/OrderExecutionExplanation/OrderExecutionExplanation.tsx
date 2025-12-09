import React from 'react';
import {
  Box,
  Typography,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
} from '@mui/material';
import {
  Warning,
  Info,
  CheckCircle,
  Error as ErrorIcon,
} from '@mui/icons-material';

interface OrderExecutionExplanationProps {
  context?: 'trading' | 'backtesting';
}

export const OrderExecutionExplanation: React.FC<OrderExecutionExplanationProps> = ({
  context = 'backtesting',
}) => {
  const isBacktesting = context === 'backtesting';

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Order Execution Explanation
      </Typography>

      <Alert severity="warning" sx={{ mb: 3, mt: 2 }}>
        <Typography variant="body2" fontWeight="medium">
          Important: Order Execution Differences
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {isBacktesting ? (
            <>
              Our backtesting order execution logic is a <strong>simulation</strong> and may not 
              match the order execution your broker uses when running actual trading sessions. 
              Backtest results are estimates and should be used with caution.
            </>
          ) : (
            <>
              Order execution in live trading depends on your broker's systems, market conditions, 
              and order routing. Results may vary from backtest simulations.
            </>
          )}
        </Typography>
      </Alert>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        How Orders Are Executed
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
        <List dense>
          <ListItem>
            <ListItemIcon>
              <CheckCircle color="primary" fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Market Orders"
              secondary="Execute immediately at the current market price, with slippage applied based on your settings."
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircle color="primary" fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Limit Orders"
              secondary="Execute only when the price reaches your specified limit price (or better)."
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircle color="primary" fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Stop Orders"
              secondary="Convert to market orders when the stop price is triggered."
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <CheckCircle color="primary" fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Stop Limit Orders"
              secondary="Convert to limit orders when the stop price is triggered."
            />
          </ListItem>
        </List>
      </Paper>

      <Typography variant="h6" gutterBottom>
        Slippage Models
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" paragraph>
          Slippage represents the difference between the expected price and the actual execution price:
        </Typography>
        <List dense>
          <ListItem>
            <ListItemText
              primary="None"
              secondary="Orders execute at the exact price (idealized scenario)."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Fixed"
              secondary="Apply a fixed percentage slippage to all orders (e.g., 0.1% = $0.10 per $100)."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Proportional"
              secondary="Slippage increases with trade size, simulating market impact for larger orders."
            />
          </ListItem>
        </List>
      </Box>

      <Typography variant="h6" gutterBottom>
        Commissions
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Commissions are calculated based on your configured commission rate and applied to each trade. 
        This helps provide more realistic backtest results that account for trading costs.
      </Typography>

      {isBacktesting && (
        <>
          <Divider sx={{ my: 3 }} />
          <Alert severity="info" icon={<Info />}>
            <Typography variant="body2" fontWeight="medium" gutterBottom>
              Backtesting Limitations
            </Typography>
            <Typography variant="body2" component="div">
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Historical data may not reflect real-time market conditions</li>
                <li>Order fills are simulated and may differ from actual broker execution</li>
                <li>Market depth and liquidity are approximated</li>
                <li>Extended hours trading may not be accurately represented</li>
                <li>Partial fills are simplified based on available volume</li>
              </ul>
            </Typography>
          </Alert>
        </>
      )}

      <Divider sx={{ my: 3 }} />

      <Alert severity="error" icon={<ErrorIcon />}>
        <Typography variant="body2" fontWeight="medium" gutterBottom>
          Use at Your Own Risk
        </Typography>
        <Typography variant="body2">
          Always verify backtest results with paper trading before using real capital. 
          Past performance does not guarantee future results. Trading involves risk of loss.
        </Typography>
      </Alert>
    </Box>
  );
};

export default OrderExecutionExplanation;

