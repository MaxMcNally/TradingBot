export interface StrategySummaryProps {
  title?: string;
  selectedStrategy: string;
  strategyParameters: Record<string, any>;
  showParameters?: boolean;
  compact?: boolean;
}
