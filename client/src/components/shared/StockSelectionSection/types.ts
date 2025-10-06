export interface StockSelectionSectionProps {
  selectedStocks: string[];
  onStocksChange: (stocks: string[]) => void;
  maxStocks?: number;
  title?: string;
  description?: string;
  showSummary?: boolean;
  summaryTitle?: string;
  compact?: boolean;
  showQuickAdd?: boolean;
  showPopularStocks?: boolean;
  showTips?: boolean;
}
