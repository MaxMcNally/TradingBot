import React from 'react';
import {
  Box,
  Typography,
  Container,
  Link,
  Divider
} from '@mui/material';
import { FooterProps } from './Footer.types';

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
            <Link
              href="#"
              color="text.secondary"
              underline="hover"
              sx={{ fontSize: '0.875rem' }}
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              color="text.secondary"
              underline="hover"
              sx={{ fontSize: '0.875rem' }}
            >
              Terms of Service
            </Link>
            <Link
              href="#"
              color="text.secondary"
              underline="hover"
              sx={{ fontSize: '0.875rem' }}
            >
              Support
            </Link>
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
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default Footer;
