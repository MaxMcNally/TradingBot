import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Typography, Alert } from '@mui/material';
import { useUser } from '../../hooks';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6">Access Denied</Typography>
          <Typography>
            You do not have admin privileges to access this page.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
