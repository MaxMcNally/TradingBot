import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Assessment as BacktestIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  Psychology as StrategiesIcon,
  Store as MarketplaceIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { HeaderProps } from './Header.types';

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    onLogout();
  };

  const navigationItems = [
    { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { label: 'Backtesting', path: '/backtesting', icon: <BacktestIcon /> },
    { label: 'Strategies', path: '/strategies', icon: <StrategiesIcon /> },
    { label: 'Marketplace', path: '/marketplace', icon: <MarketplaceIcon /> },
    { label: 'Settings', path: '/settings', icon: <SettingsIcon /> },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        {/* Logo */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            mr: 4
          }}
          onClick={() => navigate('/')}
        >
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            TradingBot
          </Typography>
        </Box>

        {/* Navigation Menu */}
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                backgroundColor: isActive(item.path) ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                borderRadius: 1,
                px: 2,
                py: 1,
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        {/* User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {user?.name || user?.username || 'User'}
          </Typography>
          <IconButton
            size="large"
            onClick={handleMenuOpen}
            color="inherit"
            sx={{ p: 0.5 }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              <AccountIcon />
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
              <SettingsIcon sx={{ mr: 1 }} />
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
