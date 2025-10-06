import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Chip,
  Stack,
  Divider
} from '@mui/material';
import { useTheme } from '../ThemeProvider';
import { EnhancedThemeToggle } from '../ThemeToggle';

const ThemeDemo: React.FC = () => {
  const { mode, theme, toggleTheme, resetToSystemTheme } = useTheme();

  const isSystemTheme = !localStorage.getItem('themeMode');

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Theme System Demo
          </Typography>
          
          <Stack spacing={2}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Current Theme Status
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip 
                  label={mode} 
                  color={mode === 'light' ? 'primary' : 'secondary'}
                  variant="outlined"
                />
                <Chip 
                  label={isSystemTheme ? 'Following System' : 'Manual Override'}
                  color={isSystemTheme ? 'success' : 'warning'}
                  variant="outlined"
                />
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
                Theme Controls
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Button 
                  variant="outlined" 
                  onClick={toggleTheme}
                  size="small"
                >
                  Toggle Theme
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={resetToSystemTheme}
                  size="small"
                  disabled={isSystemTheme}
                >
                  Reset to System
                </Button>
                <EnhancedThemeToggle variant="enhanced" size="small" />
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
                System Theme Detection
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                This demo shows how the theme system responds to your system preferences:
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    <strong>First visit:</strong> Automatically matches your system theme
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    <strong>System changes:</strong> Updates automatically (if no manual override)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Manual override:</strong> Your choice is remembered and takes priority
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Reset option:</strong> Go back to following system preferences
                  </Typography>
                </li>
              </Box>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" gutterBottom>
                Test Instructions
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                To test system theme detection:
              </Typography>
              <Box component="ol" sx={{ pl: 2, m: 0 }}>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    Clear localStorage: <code>localStorage.removeItem('themeMode')</code>
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    Change your OS theme (System Preferences → General → Appearance)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    Refresh this page - it should match your system theme
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    Click "Toggle Theme" to set a manual preference
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    Change your OS theme again - the app won't change (manual override)
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2" color="text.secondary">
                    Click "Reset to System" to go back to following system preferences
                  </Typography>
                </li>
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ThemeDemo;
