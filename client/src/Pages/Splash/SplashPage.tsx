import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Stack,
} from "@mui/material";
import {
  TrendingUp,
  Assessment,
  Psychology,
  Speed,
  ArrowForward,
  Login as LoginIcon,
  PersonAdd,
} from "@mui/icons-material";

const SplashPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <TrendingUp sx={{ fontSize: 40 }} />,
      title: "Automated Trading",
      description: "Execute trades automatically based on your custom strategies",
    },
    {
      icon: <Assessment sx={{ fontSize: 40 }} />,
      title: "Strategy Backtesting",
      description: "Test your strategies against historical data before going live",
    },
    {
      icon: <Psychology sx={{ fontSize: 40 }} />,
      title: "Strategy Marketplace",
      description: "Discover and share trading strategies with the community",
    },
    {
      icon: <Speed sx={{ fontSize: 40 }} />,
      title: "Real-time Execution",
      description: "Fast and reliable trade execution with real-time monitoring",
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative elements */}
      <Box
        sx={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.1)",
          filter: "blur(80px)",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: -150,
          left: -150,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.1)",
          filter: "blur(80px)",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1, py: 8 }}>
        {/* Hero Section */}
        <Box sx={{ textAlign: "center", mb: 8 }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: "bold",
              color: "white",
              mb: 2,
              textShadow: "0 2px 10px rgba(0,0,0,0.2)",
            }}
          >
            TradingBot
          </Typography>
          <Typography
            variant="h5"
            component="h2"
            gutterBottom
            sx={{
              color: "rgba(255, 255, 255, 0.9)",
              mb: 4,
              fontWeight: 300,
            }}
          >
            Automated Trading Platform
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "rgba(255, 255, 255, 0.8)",
              mb: 6,
              maxWidth: 600,
              mx: "auto",
              fontWeight: 300,
            }}
          >
            Build, test, and deploy automated trading strategies with ease.
            Connect to Alpaca, backtest your ideas, and trade with confidence.
          </Typography>

          {/* CTA Buttons */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
            sx={{ mb: 8 }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<PersonAdd />}
              onClick={() => navigate("/login")}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: "1.1rem",
                fontWeight: 600,
                backgroundColor: "white",
                color: "#667eea",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.9)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<LoginIcon />}
              onClick={() => navigate("/login")}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: "1.1rem",
                fontWeight: 600,
                borderColor: "white",
                color: "white",
                "&:hover": {
                  borderColor: "rgba(255, 255, 255, 0.9)",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Sign In
            </Button>
            <Button
              variant="text"
              size="large"
              onClick={() => navigate("/how-it-works")}
              sx={{
                py: 1.5,
                px: 4,
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "white",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  transform: "translateY(-2px)",
                },
                transition: "all 0.3s ease",
              }}
            >
              How It Works
            </Button>
          </Stack>
        </Box>

        {/* Features Section */}
        <Box sx={{ mt: 12 }}>
          <Typography
            variant="h4"
            component="h2"
            align="center"
            gutterBottom
            sx={{
              color: "white",
              mb: 6,
              fontWeight: 600,
            }}
          >
            Powerful Features
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: "100%",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    backdropFilter: "blur(10px)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
                    },
                  }}
                >
                  <CardContent sx={{ textAlign: "center", p: 3 }}>
                    <Box
                      sx={{
                        color: "#667eea",
                        mb: 2,
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography
                      variant="h6"
                      component="h3"
                      gutterBottom
                      sx={{ fontWeight: 600, mb: 1 }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.6 }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Footer CTA */}
        <Box
          sx={{
            textAlign: "center",
            mt: 10,
            p: 4,
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: 3,
            backdropFilter: "blur(10px)",
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            sx={{ color: "white", mb: 2, fontWeight: 600 }}
          >
            Ready to Start Trading?
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: "rgba(255, 255, 255, 0.9)", mb: 3 }}
          >
            Join thousands of traders using our platform to automate their
            strategies
          </Typography>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            onClick={() => navigate("/login")}
            sx={{
              py: 1.5,
              px: 5,
              fontSize: "1.1rem",
              fontWeight: 600,
              backgroundColor: "white",
              color: "#667eea",
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.9)",
                transform: "translateY(-2px)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              },
              transition: "all 0.3s ease",
            }}
          >
            Get Started Now
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default SplashPage;

