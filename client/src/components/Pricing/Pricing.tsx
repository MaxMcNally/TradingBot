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
  Skeleton
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useNavigate } from "react-router-dom";
import { useSubscription, useUser } from "../../hooks";
import { PlanTier } from "../../types/user";

const Pricing: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const {
    plans,
    subscription,
    isPlansLoading
  } = useSubscription({ enabled: Boolean(user) });

  const handleSelectPlan = (tier: PlanTier) => {
    navigate("/checkout", { state: { planTier: tier } });
  };

  const renderPlanCard = (plan: (typeof plans)[number]) => {
    const isCurrent = subscription?.planTier === plan.tier;
    return (
      <Grid item xs={12} md={6} lg={3} key={plan.tier}>
        <Card
          elevation={isCurrent ? 6 : 2}
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            border: isCurrent ? "2px solid" : "1px solid",
            borderColor: isCurrent ? "primary.main" : "divider"
          }}
        >
          <CardHeader
            title={plan.name}
            subheader={plan.headline}
            action={plan.badge ? <Chip color="secondary" label={plan.badge} size="small" /> : null}
          />
          <CardContent sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="div">
              ${plan.monthlyPrice.toFixed(2)}
              <Typography component="span" variant="subtitle2" sx={{ ml: 0.5 }}>
                /month
              </Typography>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
              Billed monthly, cancel anytime.
            </Typography>

            <List dense>
              {plan.features.map((feature) => (
                <ListItem key={feature}>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={feature} />
                </ListItem>
              ))}
            </List>
          </CardContent>
          <CardActions sx={{ flexDirection: "column", alignItems: "stretch", px: 3, pb: 3 }}>
            <Button
              variant={isCurrent ? "outlined" : "contained"}
              color={isCurrent ? "success" : "primary"}
              disabled={isCurrent}
              onClick={() => handleSelectPlan(plan.tier)}
            >
              {isCurrent ? "Current Plan" : "Choose Plan"}
            </Button>
          </CardActions>
        </Card>
      </Grid>
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
          Pricing Plans
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Choose the plan that fits your automation goals. Tier benefits will be finalized soon, but you can reserve your spot now.
        </Typography>
      </Box>

      {isPlansLoading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <Grid item xs={12} md={6} lg={3} key={idx}>
              <Skeleton variant="rectangular" height={320} />
            </Grid>
          ))}
        </Grid>
      ) : plans.length > 0 ? (
        <Grid container spacing={3}>
          {plans.map((plan) => renderPlanCard(plan))}
        </Grid>
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

export default Pricing;
