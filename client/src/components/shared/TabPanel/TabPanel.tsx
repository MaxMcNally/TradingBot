import React from 'react';
import { Box } from '@mui/material';
import { TabPanelProps } from './types';

const TabPanel: React.FC<TabPanelProps> = ({ 
  children, 
  value, 
  index, 
  padding = 3,
  ...other 
}) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: padding }}>{children}</Box>}
    </div>
  );
};

export default TabPanel;
