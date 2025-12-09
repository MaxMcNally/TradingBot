import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

export const RobotAvatar18: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M8 6h8v8H8zm-6 3h4v2H2zm20 0h-4v2h4zM4 15h3v2H4zm17 0h-3v2h3zm-15 4h3v2H6zm12 0h-3v2h3z" fill="currentColor" />
      <circle cx="12" cy="10" r="2" fill="#e0e0e0" />
      <circle cx="10" cy="8" r="1" fill="#e0e0e0" />
      <circle cx="14" cy="8" r="1" fill="#e0e0e0" />
    </SvgIcon>
  );
};

