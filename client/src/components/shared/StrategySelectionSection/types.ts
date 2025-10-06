export interface StrategySelectionSectionProps {
  selectedStrategy: string;
  onStrategyChange: (strategy: string) => void;
  onParametersChange: (parameters: Record<string, any>) => void;
  strategyParameters: Record<string, any>;
  title?: string;
  description?: string;
  showSummary?: boolean;
  summaryTitle?: string;
  compact?: boolean;
  showTips?: boolean;
  availableStrategies?: any[];
}
