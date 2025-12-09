import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

export const RobotAvatar9: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M9 4h6v10H9zm-7 4h6v4H2zm16 0h6v4h-6zm-4 11h4v4H8zM11 1h2v2h-2z" fill="currentColor" />
      <circle cx="12" cy="9" r="2" fill="#e0e0e0" />
    </SvgIcon>
  );
};

