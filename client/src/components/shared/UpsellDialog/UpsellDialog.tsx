import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Rocket as RocketIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PlanTier, TierLimits, BillingPlan } from '../../../api';

export interface UpsellDialogProps {
  open: boolean;
  onClose: () => void;
  type: 'bot_creation' | 'bot_running';
  currentTier: PlanTier;
  currentLimits: TierLimits;
  currentUsage: {
    totalBots?: number;
    runningBots?: number;
  };
  recommendedPlans?: BillingPlan[];
}

const formatLimit = (limit: number): string => {
  return limit === -1 ? 'Unlimited' : limit.toString();
};

export const UpsellDialog: React.FC<UpsellDialogProps> = ({
  open,
  onClose,
  type,
  currentTier,
  currentLimits,
  currentUsage,
  recommendedPlans = []
}) => {
  const navigate = useNavigate();

  const isCreationLimit = type === 'bot_creation';
  const limitType = isCreationLimit ? 'bot creation' : 'running bot';
  const currentCount = isCreationLimit ? currentUsage.totalBots : currentUsage.runningBots;
  const maxAllowed = isCreationLimit ? currentLimits.maxBots : currentLimits.maxRunningBots;

  const handleUpgrade = () => {
    onClose();
    navigate('/pricing');
  };

  const getUpgradeRecommendation = (): BillingPlan | undefined => {
    // Find the next tier with higher limits
    const tierOrder: PlanTier[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'];
    const currentIndex = tierOrder.indexOf(currentTier);
    
    for (let i = currentIndex + 1; i < tierOrder.length; i++) {
      const plan = recommendedPlans.find(p => p.tier === tierOrder[i]);
      if (plan) {
        const planLimit = isCreationLimit ? plan.limits.maxBots : plan.limits.maxRunningBots;
        if (planLimit === -1 || planLimit > maxAllowed) {
          return plan;
        }
      }
    }
    
    return recommendedPlans.find(p => p.tier !== currentTier);
  };

  const recommendedPlan = getUpgradeRecommendation();

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <WarningIcon color="warning" />
          <Typography variant="h6">
            {isCreationLimit ? 'Bot Creation Limit Reached' : 'Running Bot Limit Reached'}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            You've reached the {limitType} limit for your <strong>{currentLimits.displayName}</strong> plan.
          </Typography>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            Current Usage
          </Typography>
          <Box display="flex" gap={2} flexWrap="wrap">
            <Chip 
              label={`${currentCount || 0} / ${formatLimit(maxAllowed)} ${isCreationLimit ? 'bots created' : 'bots running'}`}
              color="warning"
              variant="outlined"
            />
            <Chip 
              label={`${currentTier} Plan`}
              color="default"
              variant="outlined"
            />
          </Box>
        </Box>

        {recommendedPlan && (
          <Box sx={{ 
            p: 2, 
            borderRadius: 2, 
            bgcolor: 'primary.50',
            border: '1px solid',
            borderColor: 'primary.200'
          }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <RocketIcon color="primary" />
              <Typography variant="subtitle1" fontWeight="bold">
                Upgrade to {recommendedPlan.name}
              </Typography>
              {recommendedPlan.badge && (
                <Chip label={recommendedPlan.badge} size="small" color="primary" />
              )}
            </Box>

            <Typography variant="body2" color="text.secondary" gutterBottom>
              {recommendedPlan.headline}
            </Typography>

            <Typography variant="h5" color="primary" sx={{ my: 2 }}>
              ${recommendedPlan.monthlyPrice.toFixed(2)}
              <Typography component="span" variant="body2" color="text.secondary">
                /month
              </Typography>
            </Typography>

            <List dense>
              {recommendedPlan.features.slice(0, 4).map((feature, index) => (
                <ListItem key={index} disableGutters sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckIcon color="success" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={feature}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>

            <Box display="flex" gap={1} mt={2}>
              <Chip 
                icon={<TrendingUpIcon />}
                label={`${formatLimit(recommendedPlan.limits.maxBots)} bots`}
                size="small"
                color="success"
              />
              <Chip 
                icon={<TrendingUpIcon />}
                label={`${formatLimit(recommendedPlan.limits.maxRunningBots)} running`}
                size="small"
                color="success"
              />
            </Box>
          </Box>
        )}

        {!recommendedPlan && (
          <Typography variant="body2" color="text.secondary">
            {currentTier === 'ENTERPRISE' 
              ? 'You have the highest tier plan. Contact support if you need additional resources.'
              : 'Upgrade your plan to unlock higher limits and more features.'}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} color="inherit">
          Maybe Later
        </Button>
        <Button 
          onClick={handleUpgrade} 
          variant="contained" 
          color="primary"
          startIcon={<RocketIcon />}
        >
          View Upgrade Options
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpsellDialog;
