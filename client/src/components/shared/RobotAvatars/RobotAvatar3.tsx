import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

export const RobotAvatar3: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M4 7h16v8H4zm-2 9h3v4H2zm5 0h3v4H7zm5 0h3v4h-3zm5 0h3v4h-3zM6 3h2v3H6zm10 0h2v3h-2z" fill="currentColor" />
      <rect x="7" y="10" width="10" height="3" rx="1.5" fill="#e0e0e0" />
    </SvgIcon>
  );
};

