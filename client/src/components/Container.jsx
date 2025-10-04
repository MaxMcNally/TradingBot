import React from 'react';
import { Box } from '@mui/material';

const Container = ({ children, maxWidth = 'sm', sx = {} }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%',
        px: 2,
        ...sx,
      }}
    >
      <Box sx={{ width: '100%', maxWidth }}>{children}</Box>
    </Box>
  );
};

export default Container;
