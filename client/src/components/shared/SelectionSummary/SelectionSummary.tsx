import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
} from '@mui/material';
import { SelectionSummaryProps } from './types';

const SelectionSummary: React.FC<SelectionSummaryProps> = ({
  title = "Selection Summary",
  selectedItems,
  itemLabel = "item",
  itemLabelPlural = "items",
  maxItems,
  variant = 'generic',
  showCount = true,
  showItems = true,
  emptyMessage,
  chipColor = 'primary',
  chipVariant = 'outlined',
}) => {
  const count = selectedItems.length;
  const displayLabel = count === 1 ? itemLabel : itemLabelPlural;
  
  // Default empty messages based on variant
  const getDefaultEmptyMessage = () => {
    switch (variant) {
      case 'stocks':
        return 'No stocks selected';
      case 'symbols':
        return 'No symbols selected';
      default:
        return `No ${itemLabelPlural} selected`;
    }
  };

  const defaultEmptyMessage = emptyMessage || getDefaultEmptyMessage();

  // Default count messages based on variant
  const getCountMessage = () => {
    if (maxItems) {
      return `${count}/${maxItems} ${displayLabel} selected`;
    }
    
    switch (variant) {
      case 'stocks':
        return `You have selected ${count} ${displayLabel} for trading.`;
      case 'symbols':
        return `Selected ${displayLabel}: ${count}`;
      default:
        return `${count} ${displayLabel} selected`;
    }
  };

  return (
    <Paper sx={{ p: 2, height: 'fit-content' }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      {showCount && (
        <Typography variant="body2" color="textSecondary" paragraph>
          {getCountMessage()}
        </Typography>
      )}

      {showItems && (
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            {variant === 'stocks' ? 'Selected Stocks:' : 
             variant === 'symbols' ? 'Selected Symbols:' : 
             `Selected ${itemLabelPlural}:`}
          </Typography>
          
          {count > 0 ? (
            <Box display="flex" flexWrap="wrap" gap={1}>
              {selectedItems.map((item) => (
                <Chip 
                  key={item} 
                  label={item} 
                  size="small" 
                  color={chipColor}
                  variant={chipVariant}
                />
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="textSecondary">
              {defaultEmptyMessage}
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default SelectionSummary;
