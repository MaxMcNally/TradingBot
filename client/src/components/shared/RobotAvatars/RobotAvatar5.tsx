import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

export const RobotAvatar5: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M5 2h14v12H5zm3 13h8v2H8zm-1 3h10v2H7zm1-10h12v8H8z" fill="currentColor" />
      <rect x="8" y="5" width="8" height="6" rx="0.5" fill="#e0e0e0" />
    </SvgIcon>
  );
};

