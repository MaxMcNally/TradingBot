import { TradingStrategy } from '../../../api/tradingApi';

export interface StrategySelectorProps {
  selectedStrategy: string;
  onStrategyChange: (strategy: string) => void;
  onParametersChange: (parameters: Record<string, any>) => void;
  title?: string;
  description?: string;
  showTips?: boolean;
  compact?: boolean;
  availableStrategies?: TradingStrategy[];
}
