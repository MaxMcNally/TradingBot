export interface SessionSummaryProps {
  /** Title of the summary component */
  title?: string;
  
  /** Array of selected stock symbols */
  selectedStocks?: string[];
  
  /** Selected strategy name */
  selectedStrategy?: string;
  
  /** Strategy parameters object */
  strategyParameters?: Record<string, any>;
  
  /** Mode: 'trading' or 'backtesting' */
  mode?: 'trading' | 'backtesting';
  
  /** Whether to show stocks selection step */
  showStocks?: boolean;
  
  /** Whether to show strategy selection step */
  showStrategy?: boolean;
  
  /** Whether to show parameters configuration step */
  showParameters?: boolean;
  
  /** Maximum number of stocks allowed */
  maxStocks?: number;
}
