import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from "@mui/material";
import PaymentIcon from "@mui/icons-material/Payment";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { useLocation, useNavigate } from "react-router-dom";
import { useSubscription, useUser } from "../../hooks";
import { CheckoutProvider, PlanTier } from "../../types/user";

interface CheckoutLocationState {
  planTier?: PlanTier;
}

const Checkout: React.FC = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state || {}) as CheckoutLocationState;
  const {
    plans,
    providers,
    checkout,
    subscription,
    isPlansLoading,
    isSubscriptionLoading,
    isMutating
  } = useSubscription({ enabled: Boolean(user) });

  const availablePlans = plans.length ? plans : [];
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>(locationState.planTier || availablePlans[0]?.tier || "BASIC");
  const [selectedProvider, setSelectedProvider] = useState<CheckoutProvider>("STRIPE");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paymentReference, setPaymentReference] = useState("");
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (locationState.planTier) {
      setSelectedPlan(locationState.planTier);
    }
  }, [locationState.planTier]);

  useEffect(() => {
    if (availablePlans.length && !availablePlans.find((plan) => plan.tier === selectedPlan)) {
      setSelectedPlan(availablePlans[0].tier);
    }
  }, [availablePlans, selectedPlan]);

  const currentPlan = useMemo(() => {
    return availablePlans.find((plan) => plan.tier === selectedPlan) || availablePlans[0];
  }, [availablePlans, selectedPlan]);

  if (!user) {
    return (
      <Alert severity="info">
        Please log in to complete checkout.
      </Alert>
    );
  }

  const isFreePlan = currentPlan?.tier === "FREE";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentPlan) return;

    setAlert(null);
    try {
      await checkout({
        planTier: currentPlan.tier,
        provider: isFreePlan ? undefined : selectedProvider,
        paymentMethod,
        paymentReference: paymentReference || undefined
      });
      setAlert({
        type: "success",
        message: `${currentPlan.name} plan activated.`
      });
      navigate("/settings");
    } catch (err: any) {
      setAlert({
        type: "error",
        message: err?.response?.data?.error || "Checkout failed. Please verify your details."
      });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 800, mx: "auto", width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography variant="h4">Checkout</Typography>
      <Typography variant="body2" color="text.secondary">
        Securely confirm your plan and payment provider. Tier benefits will be updated soon, but you can manage billing today.
      </Typography>

      {alert && (
        <Alert severity={alert.type}>
          {alert.message}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Plan Details
        </Typography>
        <Divider sx={{ my: 2 }} />
        {isPlansLoading ? (
          <CircularProgress size={24} />
        ) : (
          <>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="plan-select-label">Plan</InputLabel>
              <Select
                labelId="plan-select-label"
                value={selectedPlan}
                label="Plan"
                onChange={(event) => setSelectedPlan(event.target.value as PlanTier)}
              >
                {availablePlans.map((plan) => (
                  <MenuItem key={plan.tier} value={plan.tier}>
                    {plan.name} — ${plan.monthlyPrice.toFixed(2)}/mo
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {currentPlan && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  ${currentPlan.monthlyPrice.toFixed(2)} / month
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {currentPlan.headline}
                </Typography>
                <List dense>
                  {currentPlan.features.map((feature) => (
                    <ListItem key={feature}>
                      <ListItemIcon>
                        <DoneAllIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Payment Provider
        </Typography>
        <Divider sx={{ my: 2 }} />
        {isFreePlan ? (
          <Alert severity="info">
            Free plans do not require a payment provider.
          </Alert>
        ) : (
          <FormControl component="fieldset">
            <RadioGroup
              value={selectedProvider}
              onChange={(event) => setSelectedProvider(event.target.value as CheckoutProvider)}
            >
              {(providers.length ? providers : ["STRIPE", "PAYPAL", "SQUARE"]).map((provider) => (
                <FormControlLabel
                  key={provider}
                  value={provider}
                  control={<Radio />}
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PaymentIcon fontSize="small" />
                      <Typography>{provider}</Typography>
                    </Stack>
                  }
                />
              ))}
            </RadioGroup>
          </FormControl>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Payment Details
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Stack spacing={2}>
          <TextField
            label="Payment Method"
            value={paymentMethod}
            onChange={(event) => setPaymentMethod(event.target.value)}
            helperText="For reference only (e.g. card, ACH, internal PO)."
          />
          <TextField
            label="Reference (optional)"
            value={paymentReference}
            onChange={(event) => setPaymentReference(event.target.value)}
            helperText="Transaction ID, PO number, or finance notes."
          />
        </Stack>
      </Paper>

      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={isMutating || isPlansLoading || isSubscriptionLoading}
        startIcon={isMutating ? <CircularProgress color="inherit" size={18} /> : undefined}
      >
        {isMutating ? "Processing..." : `Confirm ${currentPlan?.name || ""} Plan`}
      </Button>

      {subscription && (
        <Alert severity="info">
          Current plan: {subscription.planTier}. Next renewal: {subscription.renewsAt ? new Date(subscription.renewsAt).toLocaleDateString() : "N/A"}.
        </Alert>
      )}
    </Box>
  );
};

export default Checkout;
