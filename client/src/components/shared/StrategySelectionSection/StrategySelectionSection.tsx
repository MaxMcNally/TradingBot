import React from 'react';
import { Paper, Typography } from '@mui/material';
import { Settings } from '@mui/icons-material';
import EnhancedStrategySelector from '../EnhancedStrategySelector';
import StrategySummary from '../StrategySummary';
import TwoColumnLayout from '../TwoColumnLayout';
import { StrategySelectionSectionProps } from './types';

const StrategySelectionSection: React.FC<StrategySelectionSectionProps> = ({
  selectedStrategy,
  onStrategyChange,
  onParametersChange,
  strategyParameters,
  title = "Strategy Selection",
  description = "Choose a trading strategy that will determine when to buy and sell stocks. Each strategy has different parameters that you can customize.",
  showSummary = true,
  summaryTitle = "Strategy Summary",
  compact = false,
  showTips = true,
  availableStrategies,
}) => {
  const mainContent = (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
        {title}
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        {description}
      </Typography>
      <EnhancedStrategySelector
        selectedStrategy={selectedStrategy}
        onStrategyChange={onStrategyChange}
        onParametersChange={onParametersChange}
        title=""
        description=""
        compact={true}
        showTips={showTips}
        availableStrategies={availableStrategies}
      />
    </Paper>
  );

  const sidebar = showSummary ? (
    <StrategySummary
      title={summaryTitle}
      selectedStrategy={selectedStrategy}
      strategyParameters={strategyParameters}
      showParameters={true}
      compact={compact}
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

export default StrategySelectionSection;
