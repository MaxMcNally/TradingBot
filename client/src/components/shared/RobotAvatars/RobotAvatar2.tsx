import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

export const RobotAvatar2: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M10 2h4v2h-4zM7 5h10v12H7zm-3 4h3v2H4zm16 0h3v2h-3zM8 18h2v4H8zm6 0h2v4h-2z" fill="currentColor" />
      <rect x="10" y="8" width="4" height="4" rx="1" fill="#e0e0e0" />
    </SvgIcon>
  );
};

