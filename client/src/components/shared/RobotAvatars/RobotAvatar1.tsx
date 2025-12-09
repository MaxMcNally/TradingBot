import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

export const RobotAvatar1: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M12 2a5 5 0 0 0-5 5v2h10V7a5 5 0 0 0-5-5zm-3 7h6v2H9zm-5 4v6h16v-6H4zm2 2h12v2H6zm-4 6h20v2H2z" fill="currentColor" />
      <circle cx="10" cy="6" r="1" fill="#e0e0e0" />
      <circle cx="14" cy="6" r="1" fill="#e0e0e0" />
    </SvgIcon>
  );
};

