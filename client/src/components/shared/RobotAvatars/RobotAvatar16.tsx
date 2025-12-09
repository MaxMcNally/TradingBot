import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

export const RobotAvatar16: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M6 5h12v8H6zm-5 9h5v4H1zm18 0h5v4h-5zm-12 5h12v4H7zm3-17h4v3h-4z" fill="currentColor" />
      <rect x="8" y="8" width="8" height="3" fill="#e0e0e0" />
    </SvgIcon>
  );
};

