import React from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Stack,
} from "@mui/material";
import {
  SmartToy,
  Assessment,
  TrendingUp,
  Psychology,
  AccountBalance,
  Speed,
  CheckCircle,
  Close,
  Star,
  Business,
  Api,
  Webhook,
} from "@mui/icons-material";

const HowItWorksPage: React.FC = () => {
  const botLifecycle = [
    {
      label: "Creation",
      description: "Select or create a strategy and configure trading parameters",
    },
    {
      label: "Testing",
      description: "Backtest your bot against historical market data",
    },
    {
      label: "Execution",
      description: "Run in Paper Trading (simulated) or Live Trading (real capital) modes",
    },
    {
      label: "Monitoring",
      description: "Track real-time performance and analytics",
    },
    {
      label: "Optimization",
      description: "Refine strategies based on performance data",
    },
    {
      label: "Monetization",
      description: "List successful bots in the Marketplace",
    },
  ];

  const tradingModes = [
    {
      icon: <Assessment sx={{ fontSize: 40 }} />,
      title: "Backtesting",
      description: "Test bots against historical market data. Analyze performance metrics before risking capital. Optimize strategy parameters.",
      available: "All tiers",
    },
    {
      icon: <AccountBalance sx={{ fontSize: 40 }} />,
      title: "Paper Trading",
      description: "Simulated trading with virtual capital. Real-time market data and execution simulation. Risk-free strategy validation.",
      available: "Free, Basic, Premium",
    },
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: "Live Trading",
      description: "Real capital deployment through Alpaca account integration. Actual market execution with real profits and losses.",
      available: "Basic, Premium, Enterprise",
    },
  ];

  const userTiers = [
    {
      name: "Free",
      price: "$0",
      icon: <CheckCircle sx={{ fontSize: 30 }} />,
      color: "default" as const,
      capabilities: [
        "Create 1 basic bot",
        "Backtest bots",
        "Paper trade bots",
        "View Leaderboard",
        "Browse Marketplace (read-only)",
        "Clone and edit Free Public Bots",
      ],
      limitations: [
        "Cannot create custom strategies",
        "Cannot live trade",
        "Cannot sell bots",
        "Limited to one active bot",
      ],
      target: "New users exploring the platform",
    },
    {
      name: "Basic",
      price: "$9.99/month",
      icon: <Star sx={{ fontSize: 30 }} />,
      color: "primary" as const,
      capabilities: [
        "Create multiple basic bots",
        "Backtest bots",
        "Paper trade bots",
        "Live trade with Alpaca",
        "View Leaderboard",
        "Browse Marketplace (read-only)",
        "Clone and edit Free Public Bots",
      ],
      limitations: [
        "Cannot create custom strategies",
        "Cannot sell bots in Marketplace",
      ],
      target: "Individual traders expanding automation",
    },
    {
      name: "Premium",
      price: "$29.99/month",
      icon: <Star sx={{ fontSize: 30, color: "#FFD700" }} />,
      color: "warning" as const,
      capabilities: [
        "Create unlimited basic bots",
        "Create custom bots",
        "Backtest bots",
        "Paper trade bots",
        "Live trade with Alpaca",
        "View Leaderboard",
        "Sell bots in Marketplace (Free Public or Paid)",
        "Buy bots from Marketplace (Free Public or Paid)",
        "Clone and edit Free Public Bots",
      ],
      limitations: [],
      target: "Advanced users needing unlimited strategies",
    },
    {
      name: "Enterprise",
      price: "$199.99/month",
      icon: <Business sx={{ fontSize: 30 }} />,
      color: "success" as const,
      capabilities: [
        "All Premium tier features",
        "Programmatic API access",
        "Webhook integration",
        "Dedicated support",
        "Priority processing",
        "Custom SLA options",
      ],
      limitations: [],
      target: "Organizations needing dedicated support",
    },
  ];

  const featureComparison = [
    { feature: "Basic Bots", free: "1", basic: "Unlimited", premium: "Unlimited", enterprise: "Unlimited" },
    { feature: "Custom Bots", free: "❌", basic: "❌", premium: "✅", enterprise: "✅" },
    { feature: "Backtesting", free: "✅", basic: "✅", premium: "✅", enterprise: "✅" },
    { feature: "Paper Trading", free: "✅", basic: "✅", premium: "✅", enterprise: "✅" },
    { feature: "Live Trading", free: "❌", basic: "✅", premium: "✅", enterprise: "✅" },
    { feature: "Leaderboard", free: "✅", basic: "✅", premium: "✅", enterprise: "✅" },
    { feature: "Marketplace (Buy Paid)", free: "❌", basic: "❌", premium: "✅", enterprise: "✅" },
    { feature: "Marketplace (Clone Free)", free: "✅", basic: "✅", premium: "✅", enterprise: "✅" },
    { feature: "Marketplace (Sell)", free: "❌", basic: "❌", premium: "✅", enterprise: "✅" },
    { feature: "API Access", free: "❌", basic: "❌", premium: "❌", enterprise: "✅" },
    { feature: "Webhooks", free: "❌", basic: "❌", premium: "❌", enterprise: "✅" },
    { feature: "Dedicated Support", free: "❌", basic: "❌", premium: "❌", enterprise: "✅" },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Hero Section */}
      <Box sx={{ mb: 8, textAlign: "center" }}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
          How It Works
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: "auto", mt: 2 }}>
          Learn how TradingBot empowers you to create, test, trade, and monetize automated trading strategies
        </Typography>
      </Box>

      {/* Core Concept: Bots */}
      <Paper sx={{ p: 4, mb: 6 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <SmartToy sx={{ fontSize: 50, color: "primary.main", mr: 2 }} />
          <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
            What is a Bot?
          </Typography>
        </Box>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, fontSize: "1.1rem" }}>
          A <strong>Bot</strong> is a Trading Session that implements a Strategy. Each bot represents a specific trading strategy (custom or basic), a trading session configuration, performance tracking and analytics, and a potential asset for the marketplace.
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Bot Lifecycle
          </Typography>
          <Stepper orientation="vertical">
            {botLifecycle.map((step, index) => (
              <Step key={step.label} active={true} completed={false}>
                <StepLabel>{step.label}</StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Box>
      </Paper>

      {/* Strategy Types */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 4, textAlign: "center" }}>
          Strategy Types
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: "100%", transition: "transform 0.2s", "&:hover": { transform: "translateY(-4px)" } }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Speed sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
                  <Typography variant="h5" component="h3" sx={{ fontWeight: 600 }}>
                    Basic Strategies
                  </Typography>
                </Box>
                <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
                  Pre-configured, ready-to-use trading strategies that users can select and deploy immediately. These include common algorithmic trading patterns like Moving Average Crossovers, Momentum Indicators, Mean Reversion, Breakout Strategies, and more.
                </Typography>
                <Chip label="Available to all tiers" color="primary" size="small" />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: "100%", transition: "transform 0.2s", "&:hover": { transform: "translateY(-4px)" } }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Psychology sx={{ fontSize: 40, color: "warning.main", mr: 2 }} />
                  <Typography variant="h5" component="h3" sx={{ fontWeight: 600 }}>
                    Custom Strategies
                  </Typography>
                </Box>
                <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
                  User-created strategies built using the Custom Strategy Builder. These allow advanced users to define custom entry and exit conditions, implement complex trading logic, combine multiple indicators, and create proprietary trading algorithms.
                </Typography>
                <Chip label="Premium & Enterprise" color="warning" size="small" />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Trading Modes */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 4, textAlign: "center" }}>
          Trading Modes
        </Typography>
        <Grid container spacing={4}>
          {tradingModes.map((mode, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Card sx={{ height: "100%", transition: "transform 0.2s", "&:hover": { transform: "translateY(-4px)" } }}>
                <CardContent sx={{ textAlign: "center", p: 3 }}>
                  <Box sx={{ color: "primary.main", mb: 2, display: "flex", justifyContent: "center" }}>
                    {mode.icon}
                  </Box>
                  <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                    {mode.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 2 }}>
                    {mode.description}
                  </Typography>
                  <Chip label={mode.available} size="small" color="primary" variant="outlined" />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Performance & Marketplace */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, height: "100%" }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center" }}>
              <TrendingUp sx={{ mr: 1, color: "primary.main" }} />
              Leaderboard
            </Typography>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              Bots are ranked based on performance metrics including Total Return, Sharpe Ratio, Maximum Drawdown, Win Rate, and more. Public visibility encourages competition and drives platform engagement.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 4, height: "100%" }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2, display: "flex", alignItems: "center" }}>
              <Psychology sx={{ mr: 1, color: "warning.main" }} />
              Marketplace
            </Typography>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8, mb: 2 }}>
              The Marketplace offers two types of bots:
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Free Public Bots
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Can be cloned and edited by any user. Perfect for learning and community collaboration.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Paid Bots
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Proprietary and non-editable. Strategy creators earn revenue while buyers get ready-to-use strategies.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* User Tiers */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 4, textAlign: "center" }}>
          User Tiers & Capabilities
        </Typography>
        <Grid container spacing={4}>
          {userTiers.map((tier, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Card
                sx={{
                  height: "100%",
                  border: tier.color === "warning" ? 2 : 1,
                  borderColor: tier.color === "warning" ? "warning.main" : "divider",
                  transition: "transform 0.2s",
                  "&:hover": { transform: "translateY(-4px)" },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Box sx={{ color: `${tier.color}.main`, mr: 1 }}>{tier.icon}</Box>
                      <Typography variant="h5" component="h3" sx={{ fontWeight: 600 }}>
                        {tier.name} Tier
                      </Typography>
                    </Box>
                    <Chip label={tier.price} color={tier.color} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, fontStyle: "italic" }}>
                    {tier.target}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Capabilities:
                  </Typography>
                  <Stack spacing={0.5} sx={{ mb: 2 }}>
                    {tier.capabilities.map((cap, i) => (
                      <Box key={i} sx={{ display: "flex", alignItems: "flex-start" }}>
                        <CheckCircle sx={{ fontSize: 16, color: "success.main", mr: 1, mt: 0.5 }} />
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {cap}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                  {tier.limitations.length > 0 && (
                    <>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Limitations:
                      </Typography>
                      <Stack spacing={0.5}>
                        {tier.limitations.map((lim, i) => (
                          <Box key={i} sx={{ display: "flex", alignItems: "flex-start" }}>
                            <Close sx={{ fontSize: 16, color: "error.main", mr: 1, mt: 0.5 }} />
                            <Typography variant="body2" sx={{ flex: 1 }}>
                              {lim}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Feature Comparison Table */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 4, textAlign: "center" }}>
          Feature Comparison
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Feature</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Free</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Basic</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Premium</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600 }}>Enterprise</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {featureComparison.map((row, index) => (
                <TableRow key={index} sx={{ "&:nth-of-type(odd)": { backgroundColor: "action.hover" } }}>
                  <TableCell component="th" scope="row" sx={{ fontWeight: 500 }}>
                    {row.feature}
                  </TableCell>
                  <TableCell align="center">{row.free}</TableCell>
                  <TableCell align="center">{row.basic}</TableCell>
                  <TableCell align="center">{row.premium}</TableCell>
                  <TableCell align="center">{row.enterprise}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Enterprise Features */}
      <Paper sx={{ p: 4, mb: 6, backgroundColor: "primary.main", color: "white" }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3, display: "flex", alignItems: "center" }}>
          <Business sx={{ mr: 1 }} />
          Enterprise Features
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
              <Api sx={{ mr: 2, fontSize: 30 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Programmatic API Access
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Full API access for bot creation, management, strategy execution, performance data retrieval, and automated trading workflows.
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
              <Webhook sx={{ mr: 2, fontSize: 30 }} />
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  Webhook Integration
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Real-time event notifications, custom integrations, and automated responses to trading events.
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Design Principles */}
      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Design Principles
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              <strong>Progressive Disclosure:</strong> Start simple (Free tier) and unlock capabilities as users grow
            </Typography>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              <strong>Risk Management:</strong> Paper trading and backtesting before live trading
            </Typography>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              <strong>Community-Driven:</strong> Leaderboard and Marketplace foster engagement
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              <strong>Flexibility:</strong> Support both beginners (basic strategies) and experts (custom strategies)
            </Typography>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              <strong>Monetization:</strong> Multiple revenue streams (subscriptions, marketplace commissions)
            </Typography>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              <strong>Scalability:</strong> Enterprise tier supports organizational needs
            </Typography>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default HowItWorksPage;

