export interface SelectionSummaryProps {
  title?: string;
  selectedItems: string[];
  itemLabel?: string;
  itemLabelPlural?: string;
  maxItems?: number;
  variant?: 'stocks' | 'symbols' | 'generic';
  showCount?: boolean;
  showItems?: boolean;
  emptyMessage?: string;
  chipColor?: 'primary' | 'secondary' | 'default';
  chipVariant?: 'filled' | 'outlined';
}
