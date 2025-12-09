import React from 'react';
import {
  Box,
  Grid,
  IconButton,
  Typography,
} from '@mui/material';
import {
  RobotAvatar1,
  RobotAvatar2,
  RobotAvatar3,
  RobotAvatar4,
  RobotAvatar5,
  RobotAvatar6,
  RobotAvatar7,
  RobotAvatar8,
  RobotAvatar9,
  RobotAvatar10,
  RobotAvatar11,
  RobotAvatar12,
  RobotAvatar13,
  RobotAvatar14,
  RobotAvatar15,
  RobotAvatar16,
  RobotAvatar17,
  RobotAvatar18,
  RobotAvatar19,
  RobotAvatar20,
} from './index';

const AVATARS = [
  RobotAvatar1,
  RobotAvatar2,
  RobotAvatar3,
  RobotAvatar4,
  RobotAvatar5,
  RobotAvatar6,
  RobotAvatar7,
  RobotAvatar8,
  RobotAvatar9,
  RobotAvatar10,
  RobotAvatar11,
  RobotAvatar12,
  RobotAvatar13,
  RobotAvatar14,
  RobotAvatar15,
  RobotAvatar16,
  RobotAvatar17,
  RobotAvatar18,
  RobotAvatar19,
  RobotAvatar20,
];

export interface RobotAvatarSelectorProps {
  selectedAvatar?: number | null;
  onAvatarSelect: (avatarNumber: number) => void;
  size?: number;
}

export const RobotAvatarSelector: React.FC<RobotAvatarSelectorProps> = ({
  selectedAvatar,
  onAvatarSelect,
  size = 48,
}) => {
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        Choose Avatar
      </Typography>
      <Grid container spacing={1} sx={{ mt: 1 }}>
        {AVATARS.map((AvatarComponent, index) => {
          const avatarNumber = index + 1;
          const isSelected = selectedAvatar === avatarNumber;
          
          return (
            <Grid item key={avatarNumber}>
              <IconButton
                onClick={() => onAvatarSelect(avatarNumber)}
                sx={{
                  p: 1,
                  border: isSelected ? 2 : 1,
                  borderColor: isSelected ? 'primary.main' : 'divider',
                  backgroundColor: isSelected ? 'action.selected' : 'background.paper',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <AvatarComponent sx={{ fontSize: size }} />
              </IconButton>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

