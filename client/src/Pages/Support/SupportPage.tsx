import React, { useState } from "react";
import {
  Box,
  Typography,
  Container,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from "@mui/material";
import {
  ExpandMore,
  Email,
  Help,
  BugReport,
  Feedback,
  Article,
  Chat,
} from "@mui/icons-material";

const SupportPage: React.FC = () => {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const faqs = [
    {
      question: "How do I connect my broker account?",
      answer:
        "Navigate to Settings > Alpaca Trading Integration and enter your API key and secret. Make sure to use paper trading credentials for testing. Your credentials are encrypted and stored securely.",
    },
    {
      question: "How accurate are backtest results?",
      answer:
        "Backtest results are based on historical data and may not reflect future performance. Market conditions, slippage, and execution delays can affect live trading results. Always start with small positions and paper trading.",
    },
    {
      question: "Can I use multiple strategies simultaneously?",
      answer:
        "Yes! You can create and activate multiple strategies. Each strategy runs independently and can trade different symbols or the same symbols with different parameters.",
    },
    {
      question: "What happens if the service goes offline?",
      answer:
        "If TradingBot goes offline, active trading sessions will pause. We maintain high availability, but recommend monitoring your broker account directly during critical trading periods.",
    },
    {
      question: "How do I cancel my subscription?",
      answer:
        "Go to Settings > Subscription and click 'Cancel Subscription'. Your subscription will remain active until the end of your current billing period, after which you'll be moved to the Free plan.",
    },
    {
      question: "Is my trading data secure?",
      answer:
        "Yes. We use industry-standard encryption for all data transmission and storage. Your broker API credentials are encrypted at rest. We never share your data with third parties except as required for service operation.",
    },
  ];

  const supportOptions = [
    {
      icon: <Email sx={{ fontSize: 40 }} />,
      title: "Email Support",
      description: "Get help via email",
      action: "support@tradingbot.com",
      color: "primary",
    },
    {
      icon: <Help sx={{ fontSize: 40 }} />,
      title: "Documentation",
      description: "Browse our guides and tutorials",
      action: "View Docs",
      color: "secondary",
    },
    {
      icon: <BugReport sx={{ fontSize: 40 }} />,
      title: "Report a Bug",
      description: "Found an issue? Let us know",
      action: "Report Bug",
      color: "error",
    },
    {
      icon: <Feedback sx={{ fontSize: 40 }} />,
      title: "Feature Request",
      description: "Suggest a new feature",
      action: "Submit Idea",
      color: "info",
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box sx={{ mb: 6, textAlign: "center" }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Support Center
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: "auto", mt: 2 }}>
          We're here to help. Find answers to common questions or contact our support team.
        </Typography>
      </Box>

      <Grid container spacing={4} sx={{ mb: 6 }}>
        {supportOptions.map((option, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: "100%",
                textAlign: "center",
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-4px)" },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ color: `${option.color}.main`, mb: 2, display: "flex", justifyContent: "center" }}>
                  {option.icon}
                </Box>
                <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                  {option.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  {option.description}
                </Typography>
                {option.action.includes("@") ? (
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
                    {option.action}
                  </Typography>
                ) : (
                  <Button variant="outlined" color={option.color as any} size="small">
                    {option.action}
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          Frequently Asked Questions
        </Typography>
        {faqs.map((faq, index) => (
          <Accordion
            key={index}
            expanded={expanded === `panel${index}`}
            onChange={handleChange(`panel${index}`)}
            sx={{ mb: 1 }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                {faq.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: "text.secondary" }}>
                {faq.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      <Paper sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Contact Support
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                General Support
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                For general questions, account issues, or feature help:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Email: support@tradingbot.com
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Response time: Within 24 hours
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Technical Issues
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                For bugs, technical problems, or integration issues:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                Email: tech@tradingbot.com
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Response time: Within 12 hours
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Quick Contact Form
              </Typography>
              <Box component="form" sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Your Email"
                  type="email"
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Subject"
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Message"
                  multiline
                  rows={4}
                  margin="normal"
                  required
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  sx={{ mt: 2 }}
                  startIcon={<Chat />}
                >
                  Send Message
                </Button>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 4, mt: 4, backgroundColor: "primary.main", color: "white" }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          Need Immediate Help?
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9, lineHeight: 1.8 }}>
          For urgent issues affecting your live trading, please email
          urgent@tradingbot.com with "URGENT" in the subject line. We prioritize
          these requests and aim to respond within 2 hours during business hours.
        </Typography>
      </Paper>
    </Container>
  );
};

export default SupportPage;

