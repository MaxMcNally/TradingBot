import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Box,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { OrderExecutionExplanation } from '../../OrderExecutionExplanation';

interface OrderExecutionModalProps {
  open: boolean;
  onClose: () => void;
  context?: 'trading' | 'backtesting';
}

export const OrderExecutionModal: React.FC<OrderExecutionModalProps> = ({
  open,
  onClose,
  context = 'backtesting',
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <span>Order Execution Information</span>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <OrderExecutionExplanation context={context} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderExecutionModal;

