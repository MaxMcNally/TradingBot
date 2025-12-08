import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Card,
  CardContent,
  Stack
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface PremiumUpsellDialogProps {
  open: boolean;
  onClose: () => void;
  previewMode?: boolean;
}

const PremiumUpsellDialog: React.FC<PremiumUpsellDialogProps> = ({
  open,
  onClose,
  previewMode = false
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate('/checkout', { state: { planTier: 'PREMIUM' } });
  };

  const premiumFeatures = [
    'Build custom trading algorithms with visual indicator builder',
    'Chain multiple technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands, VWAP)',
    'Use logical operators (AND, OR, NOT) to create complex conditions',
    'Compare indicators against each other or fixed values',
    'Save unlimited custom strategies',
    'Use custom strategies in live trading sessions',
    'Access to all basic strategy features',
    'Priority support'
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AutoAwesomeIcon color="primary" />
          <Typography variant="h5" component="span">
            Unlock Custom Strategy Builder
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {previewMode && (
            <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <PsychologyIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                  Custom Strategy Builder Preview
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  With Premium, you'll get access to our powerful visual strategy builder that lets you:
                </Typography>
                <Box sx={{ pl: 2 }}>
                  <Typography variant="body2" component="div" gutterBottom>
                    • Select from 6 technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands, VWAP)
                  </Typography>
                  <Typography variant="body2" component="div" gutterBottom>
                    • Configure indicator parameters with helpful descriptions
                  </Typography>
                  <Typography variant="body2" component="div" gutterBottom>
                    • Chain conditions using AND, OR, NOT operators
                  </Typography>
                  <Typography variant="body2" component="div" gutterBottom>
                    • Compare indicators to values or other indicators
                  </Typography>
                  <Typography variant="body2" component="div">
                    • Build complex buy/sell logic with an intuitive visual interface
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}

          <Box>
            <Typography variant="h6" gutterBottom>
              Premium Plan Features
            </Typography>
            <List>
              {premiumFeatures.map((feature, index) => (
                <ListItem key={index} disablePadding>
                  <ListItemIcon>
                    <CheckCircleIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={feature} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider />

          <Box textAlign="center" py={2}>
            <Typography variant="h4" color="primary" gutterBottom>
              Upgrade to Premium
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Start building your custom trading algorithms today
            </Typography>
            <Box display="flex" justifyContent="center" gap={2} mt={2}>
              <Box textAlign="center">
                <Typography variant="h6" color="text.secondary">
                  Free Plan
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Basic strategies only
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  Premium Plan
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Custom strategy builder + all features
                </Typography>
              </Box>
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Maybe Later
        </Button>
        <Button
          onClick={handleUpgrade}
          variant="contained"
          color="primary"
          size="large"
          startIcon={<TrendingUpIcon />}
        >
          Upgrade to Premium
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PremiumUpsellDialog;

