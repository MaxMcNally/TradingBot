import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

export const RobotAvatar4: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M11 1h2v3h-2zM5 5h14v10H5zm1 11h12v2H6zm3 3h6v2H9z" fill="currentColor" />
      <circle cx="9" cy="10" r="1.5" fill="#e0e0e0" />
      <circle cx="15" cy="10" r="1.5" fill="#e0e0e0" />
    </SvgIcon>
  );
};

