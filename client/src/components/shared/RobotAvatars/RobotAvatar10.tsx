import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

export const RobotAvatar10: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M9 2h6v7H9zm-4 8h14v8H5zm-3 1h3v4H2zm19 0h3v4h-3zm-12 8h2v4H8zm6 0h2v4h-2z" fill="currentColor" />
      <rect x="10" y="4" width="4" height="2" rx="0.5" fill="#e0e0e0" />
    </SvgIcon>
  );
};

