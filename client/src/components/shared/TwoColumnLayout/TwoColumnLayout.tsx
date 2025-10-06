import React from 'react';
import { Box } from '@mui/material';
import { TwoColumnLayoutProps } from './types';

const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  mainContent,
  sidebar,
  gap = 3,
  mainFlex = 2,
  sidebarFlex = 1,
  direction,
  responsive = true,
}) => {
  const getDirection = () => {
    if (direction) return direction;
    if (responsive) return { xs: 'column', lg: 'row' };
    return 'row';
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      gap, 
      flexDirection: getDirection() 
    }}>
      <Box sx={{ flex: mainFlex }}>
        {mainContent}
      </Box>
      <Box sx={{ flex: sidebarFlex }}>
        {sidebar}
      </Box>
    </Box>
  );
};

export default TwoColumnLayout;
