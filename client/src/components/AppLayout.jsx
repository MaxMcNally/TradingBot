import React from 'react';
import { Box, Container, CssBaseline } from '@mui/material';

/**
 * AppLayout
 * - Centers page content
 * - Provides optional header/footer/sidebar placeholders
 * - Full-page background
 */
const AppLayout = ({ children, header, footer, sidebar}) => {
  return (
    <>
      <CssBaseline />


      <Box
        sx={{
          display: 'flex',
          minHeight: '100vh',
          flexDirection: 'column',
          backgroundColor: 'background.default',
        }}
      >
        {header && <Box component="header">{header}</Box>}

        <Box sx={{ display: 'flex', flex: 1 }}>
          {sidebar && (
            <Box
              component="aside"
              sx={{
                width: 240,
                bgcolor: 'background.paper',
                borderRight: 1,
                borderColor: 'divider',
              }}
            >
              {sidebar}
            </Box>
          )}

          <Container
            maxWidth="md"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              py: 4,
            }}
          >
            {children}
          </Container>
        </Box>

        {footer && (
          <Box
            component="footer"
            sx={{
              py: 2,
              textAlign: 'center',
              borderTop: 1,
              borderColor: 'divider',
            }}
          >
            {footer}
          </Box>
        )}
      </Box>
    </>
  );
};

export default AppLayout;
