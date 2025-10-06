export interface StockPickerProps {
  selectedStocks: string[];
  onStocksChange: (stocks: string[]) => void;
  maxStocks?: number;
  title?: string;
  description?: string;
  showQuickAdd?: boolean;
  showPopularStocks?: boolean;
  showTips?: boolean;
  compact?: boolean;
}
