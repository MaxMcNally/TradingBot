import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

export const RobotAvatar20: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M6 3h12v14H6zm-2 15h4v4H4zm14 0h4v4h-4zM8 5h8v2H8zm0 4h8v2H8zm0 4h8v2H8z" fill="currentColor" />
      <circle cx="15" cy="6" r="1" fill="#e0e0e0" />
      <circle cx="15" cy="10" r="1" fill="#e0e0e0" />
      <circle cx="15" cy="14" r="1" fill="#e0e0e0" />
    </SvgIcon>
  );
};

