import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Warning,
  Error as ErrorIcon,
  Info,
  Gavel,
} from '@mui/icons-material';
import { OrderExecutionExplanation } from '../../components/OrderExecutionExplanation';

const DisclaimersPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
        Disclaimers
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Last updated: {new Date().toLocaleDateString()}
      </Typography>

      <Divider sx={{ my: 4 }} />

      {/* General Disclaimer */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Warning color="error" sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h4" component="h2" fontWeight="bold">
            Use at Your Own Risk
          </Typography>
        </Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1" fontWeight="medium" gutterBottom>
            Important Warning
          </Typography>
          <Typography variant="body2">
            Trading in financial markets involves substantial risk of loss and is not suitable for all investors. 
            You should carefully consider whether trading is suitable for you in light of your circumstances, 
            knowledge, and financial resources. You may lose some or all of your initial investment.
          </Typography>
        </Alert>
        <Typography variant="body1" paragraph>
          TradingBot and its services are provided "as is" without warranty of any kind, either express or implied. 
          We do not guarantee the accuracy, completeness, or usefulness of any information provided, and we are not 
          responsible for any errors or omissions in the content.
        </Typography>
        <Typography variant="body1" paragraph>
          Past performance is not indicative of future results. Any historical returns, expected returns, or 
          probability projections may not reflect actual future performance. All investments involve risk of loss.
        </Typography>
      </Paper>

      {/* No Responsibility for Losses */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <ErrorIcon color="error" sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h4" component="h2" fontWeight="bold">
            No Responsibility for Financial Losses
          </Typography>
        </Box>
        <Typography variant="body1" paragraph>
          TradingBot, its developers, operators, and affiliates are not responsible for any financial losses 
          incurred as a result of using our platform, services, or trading strategies. This includes, but is 
          not limited to:
        </Typography>
        <List>
          <ListItem>
            <ListItemIcon>
              <ErrorIcon color="error" fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Losses from trading activities"
              secondary="Any losses resulting from trades executed through our platform or based on our strategies"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ErrorIcon color="error" fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Technical failures or errors"
              secondary="Losses due to system errors, bugs, connectivity issues, or data inaccuracies"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ErrorIcon color="error" fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Strategy performance"
              secondary="Losses resulting from poor strategy performance, market conditions, or execution issues"
            />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <ErrorIcon color="error" fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Broker-related issues"
              secondary="Losses due to broker execution, slippage, or other broker-specific factors"
            />
          </ListItem>
        </List>
        <Alert severity="warning" sx={{ mt: 2 }}>
          <Typography variant="body2">
            By using TradingBot, you acknowledge that you understand and accept these risks. You are solely 
            responsible for all trading decisions and their outcomes.
          </Typography>
        </Alert>
      </Paper>

      {/* Order Execution Disclaimer */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Info color="info" sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h4" component="h2" fontWeight="bold">
            Order Execution Disclaimer
          </Typography>
        </Box>
        <OrderExecutionExplanation context="backtesting" />
      </Paper>

      {/* Not Financial Advice */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Gavel color="primary" sx={{ mr: 2, fontSize: 32 }} />
          <Typography variant="h4" component="h2" fontWeight="bold">
            Not Financial Advice
          </Typography>
        </Box>
        <Typography variant="body1" paragraph>
          TradingBot is a technology platform that provides tools and services for automated trading. 
          We do not provide financial, investment, or trading advice. The information, strategies, and 
          tools provided are for educational and informational purposes only.
        </Typography>
        <Typography variant="body1" paragraph>
          You should consult with a qualified financial advisor, accountant, or other professional before 
          making any investment decisions. We are not registered investment advisors, financial planners, 
          or broker-dealers.
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            Nothing on this platform should be construed as a recommendation to buy, sell, or hold any 
            security or financial instrument.
          </Typography>
        </Alert>
      </Paper>

      {/* Data and Accuracy */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom>
          Data and Accuracy
        </Typography>
        <Typography variant="body1" paragraph>
          While we strive to provide accurate and up-to-date market data, we cannot guarantee the accuracy, 
          completeness, or timeliness of any data provided. Market data may be delayed, incomplete, or contain 
          errors. You should verify all information independently before making trading decisions.
        </Typography>
        <Typography variant="body1" paragraph>
          Historical data used in backtesting may not accurately reflect future market conditions. Market 
          conditions, regulations, and other factors can change, affecting the performance of trading strategies.
        </Typography>
      </Paper>

      {/* System Availability */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom>
          System Availability and Interruptions
        </Typography>
        <Typography variant="body1" paragraph>
          We do not guarantee uninterrupted or error-free operation of our platform. The service may be 
          unavailable due to maintenance, technical issues, or other reasons beyond our control. We are not 
          responsible for any losses resulting from service interruptions or unavailability.
        </Typography>
      </Paper>

      {/* Third-Party Services */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom>
          Third-Party Services
        </Typography>
        <Typography variant="body1" paragraph>
          TradingBot may integrate with third-party services, including brokers, data providers, and other 
          financial services. We are not responsible for the actions, services, or policies of these 
          third-party providers. Your use of third-party services is subject to their respective terms and 
          conditions.
        </Typography>
      </Paper>

      {/* Limitation of Liability */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h2" fontWeight="bold" gutterBottom>
          Limitation of Liability
        </Typography>
        <Typography variant="body1" paragraph>
          To the maximum extent permitted by law, TradingBot, its developers, operators, and affiliates 
          shall not be liable for any indirect, incidental, special, consequential, or punitive damages, 
          including but not limited to loss of profits, data, or other intangible losses, resulting from 
          your use of our services.
        </Typography>
        <Typography variant="body1" paragraph>
          Our total liability for any claims arising from or related to the use of our services shall not 
          exceed the amount you paid to us in the twelve (12) months preceding the claim.
        </Typography>
      </Paper>

      {/* Acceptance */}
      <Paper elevation={2} sx={{ p: 4, bgcolor: 'warning.light' }}>
        <Alert severity="warning" icon={<Warning />}>
          <Typography variant="body1" fontWeight="bold" gutterBottom>
            By using TradingBot, you acknowledge that you have read, understood, and agree to these disclaimers.
          </Typography>
          <Typography variant="body2">
            If you do not agree with any part of these disclaimers, you must not use our services.
          </Typography>
        </Alert>
      </Paper>
    </Container>
  );
};

export default DisclaimersPage;

