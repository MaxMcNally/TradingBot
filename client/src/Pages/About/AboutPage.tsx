import React from "react";
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Paper,
} from "@mui/material";
import {
  TrendingUp,
  Security,
  Speed,
  Psychology,
  Assessment,
  AccountBalance,
} from "@mui/icons-material";

const AboutPage: React.FC = () => {
  const features = [
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: "Automated Trading",
      description:
        "Execute trades automatically based on your custom strategies, saving time and reducing emotional decision-making.",
    },
    {
      icon: <Assessment sx={{ fontSize: 40 }} />,
      title: "Strategy Backtesting",
      description:
        "Test your trading strategies against historical data to validate performance before risking real capital.",
    },
    {
      icon: <Psychology sx={{ fontSize: 40 }} />,
      title: "Strategy Marketplace",
      description:
        "Discover proven strategies from the community or share your own successful trading approaches.",
    },
    {
      icon: <Speed sx={{ fontSize: 40 }} />,
      title: "Real-time Execution",
      description:
        "Fast and reliable trade execution with real-time monitoring and performance tracking.",
    },
    {
      icon: <Security sx={{ fontSize: 40 }} />,
      title: "Secure Integration",
      description:
        "Securely connect with Alpaca and other brokers with industry-standard security practices.",
    },
    {
      icon: <AccountBalance sx={{ fontSize: 40 }} />,
      title: "Portfolio Management",
      description:
        "Monitor your portfolio performance, track P&L, and analyze trading results in real-time.",
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 6, textAlign: "center" }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          About TradingBot
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 800, mx: "auto", mt: 2 }}>
          Empowering traders with automated strategy execution and comprehensive
          backtesting tools
        </Typography>
      </Box>

      <Paper sx={{ p: 4, mb: 6 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Our Mission
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          TradingBot was created to democratize algorithmic trading by providing
          accessible tools for traders of all experience levels. We believe that
          everyone should have the ability to automate their trading strategies,
          test them thoroughly, and execute them with confidence.
        </Typography>
        <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
          Our platform combines powerful backtesting capabilities with seamless
          broker integration, allowing you to go from strategy idea to live
          execution in a matter of minutes. Whether you're a seasoned quant
          trader or just starting your algorithmic trading journey, TradingBot
          provides the tools you need to succeed.
        </Typography>
      </Paper>

      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 4, textAlign: "center" }}>
          Key Features
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ height: "100%", transition: "transform 0.2s", "&:hover": { transform: "translateY(-4px)" } }}>
                <CardContent sx={{ textAlign: "center", p: 3 }}>
                  <Box sx={{ color: "primary.main", mb: 2, display: "flex", justifyContent: "center" }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Paper sx={{ p: 4, backgroundColor: "primary.main", color: "white" }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          Get Started Today
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9, lineHeight: 1.8 }}>
          Join thousands of traders who are already using TradingBot to automate
          their strategies and improve their trading performance. Start with our
          free plan and upgrade as your needs grow.
        </Typography>
      </Paper>
    </Container>
  );
};

export default AboutPage;

