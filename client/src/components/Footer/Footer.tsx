import React from 'react';
import {
  Box,
  Typography,
  Container,
  Link as MuiLink,
  Divider
} from '@mui/material';
import { Link } from 'react-router-dom';
import { FooterProps } from './Footer.types';

const formatTier = (tier?: string) => {
  if (!tier) return 'Free';
  return `${tier.charAt(0)}${tier.slice(1).toLowerCase()}`;
};

const Footer: React.FC<FooterProps> = ({ user }) => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {/* Left side - Copyright */}
          <Typography variant="body2" color="text.secondary">
            © {currentYear} TradingBot. All rights reserved.
          </Typography>

          {/* Center - Links */}
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              alignItems: 'center',
            }}
          >
            <MuiLink
              component={Link}
              to="/about"
              color="text.secondary"
              underline="hover"
              sx={{ fontSize: '0.875rem' }}
            >
              About
            </MuiLink>
            <MuiLink
              component={Link}
              to="/privacy"
              color="text.secondary"
              underline="hover"
              sx={{ fontSize: '0.875rem' }}
            >
              Privacy Policy
            </MuiLink>
            <MuiLink
              component={Link}
              to="/terms"
              color="text.secondary"
              underline="hover"
              sx={{ fontSize: '0.875rem' }}
            >
              Terms of Service
            </MuiLink>
            <MuiLink
              component={Link}
              to="/support"
              color="text.secondary"
              underline="hover"
              sx={{ fontSize: '0.875rem' }}
            >
              Support
            </MuiLink>
          </Box>

          {/* Right side - Version/Status */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'success.main',
              }}
            />
            <Typography variant="body2" color="text.secondary">
              v1.0.0
            </Typography>
          </Box>
        </Box>

        {/* Additional info for authenticated users */}
        {user && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
                flexWrap: 'wrap'
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Logged in as: <strong>{user.name || user.username}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                •
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Member since: {user.createdAt ? new Date(user.createdAt).getFullYear() : 'N/A'}
              </Typography>
              {user.plan_tier && (
                <>
                  <Typography variant="body2" color="text.secondary">
                    •
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Plan: {formatTier(String(user.plan_tier))}
                  </Typography>
                  {user.subscription_renews_at && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        •
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Renews: {new Date(user.subscription_renews_at).toLocaleDateString()}
                      </Typography>
                    </>
                  )}
                </>
              )}
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default Footer;
