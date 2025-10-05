export interface StrategyFormData {
  name: string;
  description: string;
  strategy_type: string;
  config: any;
  backtest_results?: any;
}

export interface StrategyDialogProps {
  open: boolean;
  onClose: () => void;
  strategy?: any;
  onSave: (data: StrategyFormData) => void;
  isLoading: boolean;
}
