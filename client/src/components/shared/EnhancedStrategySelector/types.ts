import { TradingStrategy } from '../../../api/tradingApi';

export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export interface EnhancedStrategySelectorProps {
  selectedStrategy: string;
  onStrategyChange: (strategy: string) => void;
  onParametersChange: (parameters: Record<string, any>) => void;
  title?: string;
  description?: string;
  showTips?: boolean;
  compact?: boolean;
  availableStrategies?: TradingStrategy[];
}
