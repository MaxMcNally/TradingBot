import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

export const RobotAvatar12: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M6 5h12v12H6zm-4 13h4v4H2zm18 0h4v4h-4zM4 8h2v6H4zm16 0h2v6h-2z" fill="currentColor" />
      <rect x="8" y="8" width="3" height="3" rx="0.5" fill="#e0e0e0" />
      <rect x="13" y="8" width="3" height="3" rx="0.5" fill="#e0e0e0" />
    </SvgIcon>
  );
};

