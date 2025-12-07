import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert
} from '@mui/material';
import {
  Lock as LockIcon,
  CheckCircle as CheckIcon,
  Rocket as RocketIcon,
  Star as StarIcon,
  EmojiEvents as TrophyIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PlanTier } from '../../../types/user';

export interface PremiumFeatureGateProps {
  /** The feature that requires premium access */
  featureName: string;
  /** Description of what the feature does */
  featureDescription: string;
  /** Icon to display for the feature */
  featureIcon?: React.ReactNode;
  /** The user's current plan tier */
  currentTier: PlanTier;
  /** Minimum tier required to access this feature */
  requiredTier?: PlanTier;
  /** List of benefits/features included */
  benefits?: string[];
  /** Custom call to action text */
  ctaText?: string;
  /** Whether to show a preview of the content */
  showPreview?: boolean;
  /** Preview content to show (blurred/dimmed) */
  previewContent?: React.ReactNode;
}

const TIER_ORDER: PlanTier[] = ['FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'];

const getTierIndex = (tier: PlanTier): number => {
  return TIER_ORDER.indexOf(tier);
};

export const PremiumFeatureGate: React.FC<PremiumFeatureGateProps> = ({
  featureName,
  featureDescription,
  featureIcon = <StarIcon />,
  currentTier,
  requiredTier = 'BASIC',
  benefits = [],
  ctaText = 'Upgrade Now',
  showPreview = false,
  previewContent
}) => {
  const navigate = useNavigate();

  const currentTierIndex = getTierIndex(currentTier);
  const requiredTierIndex = getTierIndex(requiredTier);
  const hasAccess = currentTierIndex >= requiredTierIndex;

  // If user has access, don't show the gate
  if (hasAccess) {
    return null;
  }

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const getNextRecommendedTier = (): PlanTier => {
    // Recommend the minimum tier that grants access
    return requiredTier;
  };

  const recommendedTier = getNextRecommendedTier();

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Preview content (blurred) */}
      {showPreview && previewContent && (
        <Box
          sx={{
            position: 'relative',
            filter: 'blur(8px)',
            opacity: 0.3,
            pointerEvents: 'none',
            userSelect: 'none',
            maxHeight: 400,
            overflow: 'hidden'
          }}
        >
          {previewContent}
        </Box>
      )}

      {/* Gate overlay */}
      <Card
        sx={{
          maxWidth: 600,
          mx: 'auto',
          my: 4,
          textAlign: 'center',
          position: showPreview ? 'absolute' : 'relative',
          top: showPreview ? '50%' : 'auto',
          left: showPreview ? '50%' : 'auto',
          transform: showPreview ? 'translate(-50%, -50%)' : 'none',
          zIndex: 1,
          boxShadow: 4
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Lock Icon */}
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'primary.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3
            }}
          >
            <LockIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          </Box>

          {/* Feature Icon and Name */}
          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={2}>
            {featureIcon}
            <Typography variant="h5" fontWeight="bold">
              {featureName}
            </Typography>
          </Box>

          {/* Description */}
          <Typography variant="body1" color="text.secondary" mb={3}>
            {featureDescription}
          </Typography>

          {/* Current Tier Alert */}
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2">
              You're currently on the <strong>{currentTier}</strong> plan. 
              Upgrade to <strong>{recommendedTier}</strong> or higher to unlock this feature.
            </Typography>
          </Alert>

          {/* Benefits */}
          {benefits.length > 0 && (
            <Box sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="subtitle2" gutterBottom>
                What you'll get:
              </Typography>
              <List dense>
                {benefits.map((benefit, index) => (
                  <ListItem key={index} disableGutters>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={benefit}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* CTA Button */}
          <Button
            variant="contained"
            size="large"
            startIcon={<RocketIcon />}
            onClick={handleUpgrade}
            sx={{ px: 4, py: 1.5 }}
          >
            {ctaText}
          </Button>

          {/* Tier Badge */}
          <Box mt={2}>
            <Chip
              label={`Requires ${recommendedTier} plan or higher`}
              color="primary"
              variant="outlined"
              size="small"
            />
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

// Specific gates for common features

export const LeaderboardGate: React.FC<{ currentTier: PlanTier }> = ({ currentTier }) => (
  <PremiumFeatureGate
    featureName="Leaderboard"
    featureDescription="See how your trading strategies rank against other traders. Compare returns, win rates, and overall performance with the community."
    featureIcon={<TrophyIcon sx={{ color: 'warning.main', fontSize: 28 }} />}
    currentTier={currentTier}
    requiredTier="BASIC"
    benefits={[
      'View global strategy rankings',
      'Compare your performance with top traders',
      'Track weekly and monthly leaderboards',
      'Filter by strategy type and timeframe',
      'See detailed performance metrics'
    ]}
    ctaText="Unlock Leaderboard Access"
  />
);

export const MarketplaceGate: React.FC<{ currentTier: PlanTier }> = ({ currentTier }) => (
  <PremiumFeatureGate
    featureName="Strategies Marketplace"
    featureDescription="Access our community marketplace to discover and copy trading strategies created by successful traders."
    featureIcon={<TrendingUpIcon sx={{ color: 'success.main', fontSize: 28 }} />}
    currentTier={currentTier}
    requiredTier="BASIC"
    benefits={[
      'Browse public trading strategies',
      'Copy strategies to your account',
      'View detailed performance history',
      'Filter by strategy type and returns',
      'Share your own strategies'
    ]}
    ctaText="Unlock Marketplace Access"
  />
);

export default PremiumFeatureGate;
