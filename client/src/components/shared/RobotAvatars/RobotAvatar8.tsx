import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

export const RobotAvatar8: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M7 3h10v10H7zm-3 11h16v6H4zm2-12h2v2H6zm10 0h2v2h-2z" fill="currentColor" />
      <rect x="9" y="7" width="6" height="4" fill="#e0e0e0" />
      <path d="M8 21h3v2H8zm5 0h3v2h-3z" fill="currentColor" />
    </SvgIcon>
  );
};

