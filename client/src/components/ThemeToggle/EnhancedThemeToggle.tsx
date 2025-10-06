import React, { useState } from 'react';
import { 
  IconButton, 
  Tooltip, 
  Menu, 
  MenuItem, 
  ListItemIcon, 
  ListItemText,
  Divider
} from '@mui/material';
import { 
  LightMode, 
  DarkMode, 
  SettingsBrightness,
  ArrowDropDown
} from '@mui/icons-material';
import { useTheme } from '../ThemeProvider';

interface EnhancedThemeToggleProps {
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
  variant?: 'simple' | 'enhanced';
}

const EnhancedThemeToggle: React.FC<EnhancedThemeToggleProps> = ({ 
  size = 'medium', 
  showTooltip = true,
  variant = 'simple'
}) => {
  const { mode, toggleTheme, resetToSystemTheme } = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (variant === 'enhanced') {
      setAnchorEl(event.currentTarget);
    } else {
      toggleTheme();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeSelect = (themeMode: 'light' | 'dark' | 'system') => {
    if (themeMode === 'system') {
      resetToSystemTheme();
    } else {
      // Only toggle if not already the selected mode
      if (mode !== themeMode) {
        toggleTheme();
      }
    }
    handleClose();
  };

  const getCurrentIcon = () => {
    return mode === 'light' ? <DarkMode /> : <LightMode />;
  };

  const getCurrentTooltip = () => {
    return mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
  };

  if (variant === 'simple') {
    const button = (
      <IconButton
        onClick={handleClick}
        size={size}
        sx={{
          color: 'text.primary',
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        }}
      >
        {getCurrentIcon()}
      </IconButton>
    );

    if (showTooltip) {
      return (
        <Tooltip title={getCurrentTooltip()} arrow>
          {button}
        </Tooltip>
      );
    }

    return button;
  }

  // Enhanced variant with dropdown menu
  return (
    <>
      <Tooltip title="Theme options" arrow>
        <IconButton
          onClick={handleClick}
          size={size}
          sx={{
            color: 'text.primary',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          {getCurrentIcon()}
          <ArrowDropDown fontSize="small" />
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleThemeSelect('light')}>
          <ListItemIcon>
            <LightMode fontSize="small" />
          </ListItemIcon>
          <ListItemText>Light</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => handleThemeSelect('dark')}>
          <ListItemIcon>
            <DarkMode fontSize="small" />
          </ListItemIcon>
          <ListItemText>Dark</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={() => handleThemeSelect('system')}>
          <ListItemIcon>
            <SettingsBrightness fontSize="small" />
          </ListItemIcon>
          <ListItemText>System</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default EnhancedThemeToggle;
