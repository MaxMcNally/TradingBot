import React from "react";
import {
  Box,
  Grid,
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  LinearProgress
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SpeedIcon from "@mui/icons-material/Speed";
import StarIcon from "@mui/icons-material/Star";
import { useNavigate } from "react-router-dom";
import { useSubscription, useUser } from "../../hooks";
import { PlanTier } from "../../types/user";

const formatLimit = (limit: number): string => {
  return limit === -1 ? "Unlimited" : limit.toString();
};

const PricingPage: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const {
    plans,
    subscription,
    limits,
    usage,
    isPlansLoading
  } = useSubscription({ enabled: Boolean(user) });

  const handleSelectPlan = (tier: PlanTier) => {
    navigate("/checkout", { state: { planTier: tier } });
  };

  // Calculate usage percentage for progress bars
  const botUsagePercent = limits && limits.maxBots !== -1 && usage
    ? Math.min(100, (usage.totalBots / limits.maxBots) * 100)
    : 0;
  const runningUsagePercent = limits && limits.maxRunningBots !== -1 && usage
    ? Math.min(100, (usage.runningBots / limits.maxRunningBots) * 100)
    : 0;

  const renderUsageCard = () => {
    if (!user || !limits || !usage) return null;

    return (
      <Card sx={{ mb: 4, bgcolor: 'background.paper' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Current Usage
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {subscription?.planTier || 'FREE'} Plan
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <SmartToyIcon color="primary" fontSize="small" />
                    <Typography variant="body2">Bots Created</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold">
                    {usage.totalBots} / {formatLimit(limits.maxBots)}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={limits.maxBots === -1 ? 0 : botUsagePercent}
                  color={botUsagePercent >= 90 ? 'warning' : 'primary'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                {limits.maxBots !== -1 && (
                  <Typography variant="caption" color="text.secondary">
                    {usage.botsRemaining} remaining
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <SpeedIcon color="primary" fontSize="small" />
                    <Typography variant="body2">Running Bots</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight="bold">
                    {usage.runningBots} / {formatLimit(limits.maxRunningBots)}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={limits.maxRunningBots === -1 ? 0 : runningUsagePercent}
                  color={runningUsagePercent >= 90 ? 'warning' : 'primary'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                {limits.maxRunningBots !== -1 && (
                  <Typography variant="caption" color="text.secondary">
                    {usage.runningBotsRemaining} remaining
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderPlanCard = (plan: (typeof plans)[number]) => {
    const isCurrent = subscription?.planTier === plan.tier;
    const isUpgrade = plans.findIndex(p => p.tier === plan.tier) > plans.findIndex(p => p.tier === subscription?.planTier);
    
    return (
      <Grid item xs={12} md={6} lg={3} key={plan.tier}>
        <Card
          elevation={isCurrent ? 6 : 2}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            border: isCurrent ? "2px solid" : "1px solid",
            borderColor: isCurrent ? "primary.main" : "divider",
            position: 'relative',
            overflow: 'visible'
          }}
        >
          {plan.badge && (
            <Chip 
              color="secondary" 
              label={plan.badge} 
              size="small"
              sx={{
                position: 'absolute',
                top: -12,
                right: 16,
                fontWeight: 'bold'
              }}
            />
          )}
          <CardHeader
            title={
              <Box display="flex" alignItems="center" gap={1}>
                {plan.name}
                {isCurrent && <Chip label="Current" size="small" color="primary" />}
              </Box>
            }
            subheader={plan.headline}
          />
          <CardContent sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="div" color="primary">
              ${plan.monthlyPrice.toFixed(2)}
              <Typography component="span" variant="subtitle2" color="text.secondary" sx={{ ml: 0.5 }}>
                /month
              </Typography>
            </Typography>
            
            {/* Limits highlight */}
            <Box sx={{ my: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="primary">
                      {formatLimit(plan.limits.maxBots)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Max Bots
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="primary">
                      {formatLimit(plan.limits.maxRunningBots)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Concurrent
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <Divider sx={{ my: 2 }} />

            <List dense disablePadding>
              {plan.features.map((feature, idx) => (
                <ListItem key={idx} disableGutters sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={feature} 
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
          <CardActions sx={{ flexDirection: "column", alignItems: "stretch", px: 3, pb: 3 }}>
            <Button
              variant={isCurrent ? "outlined" : "contained"}
              color={isCurrent ? "success" : isUpgrade ? "primary" : "inherit"}
              disabled={isCurrent}
              onClick={() => handleSelectPlan(plan.tier)}
              fullWidth
            >
              {isCurrent ? "Current Plan" : isUpgrade ? "Upgrade" : "Switch Plan"}
            </Button>
          </CardActions>
        </Card>
      </Grid>
    );
  };

  const renderComparisonTable = () => {
    if (plans.length === 0) return null;

    return (
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom textAlign="center">
          Plan Comparison
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
          See what's included in each plan
        </Typography>
        
        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell><strong>Feature</strong></TableCell>
                {plans.map(plan => (
                  <TableCell key={plan.tier} align="center">
                    <strong>{plan.name}</strong>
                    <Typography variant="caption" display="block" color="text.secondary">
                      ${plan.monthlyPrice}/mo
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Maximum Bots</TableCell>
                {plans.map(plan => (
                  <TableCell key={plan.tier} align="center">
                    <Typography fontWeight="bold" color="primary">
                      {formatLimit(plan.limits.maxBots)}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Concurrent Running Bots</TableCell>
                {plans.map(plan => (
                  <TableCell key={plan.tier} align="center">
                    <Typography fontWeight="bold" color="primary">
                      {formatLimit(plan.limits.maxRunningBots)}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Backtesting</TableCell>
                {plans.map(plan => (
                  <TableCell key={plan.tier} align="center">
                    {plan.tier === 'FREE' ? 'Daily' : 'Unlimited'}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Email Alerts</TableCell>
                {plans.map(plan => (
                  <TableCell key={plan.tier} align="center">
                    {plan.tier === 'FREE' ? '—' : <CheckCircleIcon color="success" fontSize="small" />}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>API Access</TableCell>
                {plans.map(plan => (
                  <TableCell key={plan.tier} align="center">
                    {['PREMIUM', 'ENTERPRISE'].includes(plan.tier) 
                      ? <CheckCircleIcon color="success" fontSize="small" />
                      : '—'}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Webhook Notifications</TableCell>
                {plans.map(plan => (
                  <TableCell key={plan.tier} align="center">
                    {['PREMIUM', 'ENTERPRISE'].includes(plan.tier) 
                      ? <CheckCircleIcon color="success" fontSize="small" />
                      : '—'}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Priority Support</TableCell>
                {plans.map(plan => (
                  <TableCell key={plan.tier} align="center">
                    {plan.tier === 'ENTERPRISE' ? '24/7 SLA' : 
                     plan.tier === 'PREMIUM' ? '4hr response' :
                     plan.tier === 'BASIC' ? '24hr response' : 'Community'}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell>Dedicated Success Manager</TableCell>
                {plans.map(plan => (
                  <TableCell key={plan.tier} align="center">
                    {plan.tier === 'ENTERPRISE' 
                      ? <CheckCircleIcon color="success" fontSize="small" />
                      : '—'}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  };

  if (!user) {
    return (
      <Alert severity="info">
        Please log in to view pricing and manage your subscription.
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", width: "100%" }}>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Choose Your Trading Plan
        </Typography>
        <Typography variant="body1" color="text.secondary" maxWidth={600} mx="auto">
          Scale your automated trading with the right plan. All plans include access to our powerful trading bot platform with different limits to match your needs.
        </Typography>
      </Box>

      {/* Show current usage for logged-in users */}
      {renderUsageCard()}

      {isPlansLoading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <Grid item xs={12} md={6} lg={3} key={idx}>
              <Skeleton variant="rectangular" height={480} />
            </Grid>
          ))}
        </Grid>
      ) : plans.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {plans.map((plan) => renderPlanCard(plan))}
          </Grid>
          
          {/* Comparison table */}
          {renderComparisonTable()}
          
          {/* FAQ Section */}
          <Box sx={{ mt: 6, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Frequently Asked Questions
            </Typography>
            <Grid container spacing={3} sx={{ mt: 2, textAlign: 'left' }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  What is a "bot"?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  A bot is a saved trading strategy configuration that can automatically execute trades based on your defined rules. Each bot includes strategy parameters, trading symbols, and risk management settings.
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  What does "concurrent running bots" mean?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This is the number of bots that can actively execute trades at the same time. Higher tiers allow you to run multiple strategies simultaneously across different markets.
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Can I upgrade or downgrade anytime?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Yes! You can change your plan at any time. When upgrading, you get immediate access to new features. When downgrading, your existing bots are preserved but you won't be able to create new ones if you're over the limit.
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Is there a free trial for paid plans?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Our Free tier gives you full access to test the platform. You can upgrade when you're ready to scale your trading operations.
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </>
      ) : (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading plans...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PricingPage;
