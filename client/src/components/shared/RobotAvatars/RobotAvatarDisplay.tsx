import React from 'react';
import { Box, SvgIconProps } from '@mui/material';
import { getRobotAvatar } from './index';

export interface RobotAvatarDisplayProps {
  avatar?: number | string | null;
  size?: number;
  sx?: SvgIconProps['sx'];
}

export const RobotAvatarDisplay: React.FC<RobotAvatarDisplayProps> = ({
  avatar,
  size = 40,
  sx,
}) => {
  const AvatarComponent = getRobotAvatar(avatar);
  
  if (!AvatarComponent) {
    // Default fallback icon if no avatar is selected
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: 'action.disabledBackground',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...sx,
        }}
      />
    );
  }
  
  return <AvatarComponent sx={{ fontSize: size, ...sx }} />;
};

