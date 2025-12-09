import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

export const RobotAvatar6: React.FC<SvgIconProps> = (props) => {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M12 3a6 6 0 0 0-6 6v5h12V9a6 6 0 0 0-6-6zm-9 7h3v3H3zm18 0h3v3h-3zm-9 6h2v5h-2zm-4 0h2v5H8zm8 0h2v5h-2z" fill="currentColor" />
      <rect x="9" y="8" width="6" height="3" rx="1.5" fill="#e0e0e0" />
    </SvgIcon>
  );
};

