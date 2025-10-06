import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import { TrendingUp } from '@mui/icons-material';
import StockPicker from '../StockPicker';
import SelectionSummary from '../SelectionSummary';
import TwoColumnLayout from '../TwoColumnLayout';
import { StockSelectionSectionProps } from './types';

const StockSelectionSection: React.FC<StockSelectionSectionProps> = ({
  selectedStocks,
  onStocksChange,
  maxStocks = 10,
  title = "Stock Selection",
  description = "Select the stocks you want to include. You can choose up to {maxStocks} stocks.",
  showSummary = true,
  summaryTitle = "Selection Summary",
  compact = false,
  showQuickAdd = true,
  showPopularStocks = true,
  showTips = true,
}) => {
  const mainContent = (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
        {title}
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        {description.replace('{maxStocks}', maxStocks.toString())}
      </Typography>
      <StockPicker
        selectedStocks={selectedStocks}
        onStocksChange={onStocksChange}
        maxStocks={maxStocks}
        compact={true}
        showQuickAdd={showQuickAdd}
        showPopularStocks={showPopularStocks}
        showTips={showTips}
      />
    </Paper>
  );

  const sidebar = showSummary ? (
    <SelectionSummary
      title={summaryTitle}
      selectedItems={selectedStocks}
      variant="stocks"
      maxItems={maxStocks}
      showCount={true}
      showItems={true}
    />
  ) : null;

  if (!showSummary) {
    return mainContent;
  }

  return (
    <TwoColumnLayout
      mainContent={mainContent}
      sidebar={sidebar}
      gap={3}
      mainFlex={2}
      sidebarFlex={1}
    />
  );
};

export default StockSelectionSection;
