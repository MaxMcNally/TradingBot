import { RobotAvatar1 } from './RobotAvatar1';
import { RobotAvatar2 } from './RobotAvatar2';
import { RobotAvatar3 } from './RobotAvatar3';
import { RobotAvatar4 } from './RobotAvatar4';
import { RobotAvatar5 } from './RobotAvatar5';
import { RobotAvatar6 } from './RobotAvatar6';
import { RobotAvatar7 } from './RobotAvatar7';
import { RobotAvatar8 } from './RobotAvatar8';
import { RobotAvatar9 } from './RobotAvatar9';
import { RobotAvatar10 } from './RobotAvatar10';
import { RobotAvatar11 } from './RobotAvatar11';
import { RobotAvatar12 } from './RobotAvatar12';
import { RobotAvatar13 } from './RobotAvatar13';
import { RobotAvatar14 } from './RobotAvatar14';
import { RobotAvatar15 } from './RobotAvatar15';
import { RobotAvatar16 } from './RobotAvatar16';
import { RobotAvatar17 } from './RobotAvatar17';
import { RobotAvatar18 } from './RobotAvatar18';
import { RobotAvatar19 } from './RobotAvatar19';
import { RobotAvatar20 } from './RobotAvatar20';
import React from 'react';

export { RobotAvatar1 } from './RobotAvatar1';
export { RobotAvatar2 } from './RobotAvatar2';
export { RobotAvatar3 } from './RobotAvatar3';
export { RobotAvatar4 } from './RobotAvatar4';
export { RobotAvatar5 } from './RobotAvatar5';
export { RobotAvatar6 } from './RobotAvatar6';
export { RobotAvatar7 } from './RobotAvatar7';
export { RobotAvatar8 } from './RobotAvatar8';
export { RobotAvatar9 } from './RobotAvatar9';
export { RobotAvatar10 } from './RobotAvatar10';
export { RobotAvatar11 } from './RobotAvatar11';
export { RobotAvatar12 } from './RobotAvatar12';
export { RobotAvatar13 } from './RobotAvatar13';
export { RobotAvatar14 } from './RobotAvatar14';
export { RobotAvatar15 } from './RobotAvatar15';
export { RobotAvatar16 } from './RobotAvatar16';
export { RobotAvatar17 } from './RobotAvatar17';
export { RobotAvatar18 } from './RobotAvatar18';
export { RobotAvatar19 } from './RobotAvatar19';
export { RobotAvatar20 } from './RobotAvatar20';
export { RobotAvatarDisplay } from './RobotAvatarDisplay';
export { RobotAvatarSelector } from './RobotAvatarSelector';

// Avatar lookup array - defined at module level to avoid recreating on every function call
const AVATAR_COMPONENTS: (React.ComponentType<any> | null)[] = [
  null, // 0-indexed, so index 0 is null
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

// Helper to get avatar component by number (1-20)
export const getRobotAvatar = (avatarNumber: number | string | null | undefined): React.ComponentType<any> | null => {
  const num = typeof avatarNumber === 'string' ? parseInt(avatarNumber, 10) : avatarNumber;
  if (!num || num < 1 || num > 20) return null;
  
  return AVATAR_COMPONENTS[num] || null;
};

