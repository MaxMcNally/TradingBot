import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { LightMode, DarkMode } from '@mui/icons-material';
import { useTheme } from '../ThemeProvider';

interface ThemeToggleProps {
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  size = 'medium', 
  showTooltip = true 
}) => {
  const { mode, toggleTheme } = useTheme();

  const icon = mode === 'light' ? <DarkMode /> : <LightMode />;
  const tooltipText = mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode';

  const button = (
    <IconButton
      onClick={toggleTheme}
      size={size}
      sx={{
        color: 'text.primary',
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      }}
    >
      {icon}
    </IconButton>
  );

  if (showTooltip) {
    return (
      <Tooltip title={tooltipText} arrow>
        {button}
      </Tooltip>
    );
  }

  return button;
};

export default ThemeToggle;
