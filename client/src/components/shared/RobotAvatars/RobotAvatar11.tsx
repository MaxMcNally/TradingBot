import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

export const RobotAvatar11: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M7 5h10v8H7zm-4 9h3v3H3zm18 0h3v3h-3zM11 2h2v2h-2zm-2 12h2v8H9zm6 0h2v8h-2zm-4 2h2v6h-2z" fill="currentColor" />
      <circle cx="12" cy="9" r="2.5" fill="#e0e0e0" />
    </SvgIcon>
  );
};

