import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Tooltip,
  Dialog as MuiDialog,
  DialogContent as MuiDialogContent,
  DialogTitle as MuiDialogTitle,
  DialogActions as MuiDialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  InputAdornment,
  Grid,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  DragIndicator as DragIcon,
  Add as AddIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { ConditionNode, validateCustomStrategy } from '../../api/customStrategiesApi';
import { useCustomStrategies } from '../../hooks/useCustomStrategies';

interface CustomStrategyBuilderProps {
  open: boolean;
  onClose: () => void;
  onSave: (strategy: { name: string; description?: string; buy_conditions: ConditionNode | ConditionNode[]; sell_conditions: ConditionNode | ConditionNode[]; is_public?: boolean }) => Promise<void>;
  editingStrategy?: { id: number; name: string; description?: string; buy_conditions: ConditionNode | ConditionNode[]; sell_conditions: ConditionNode | ConditionNode[]; is_public?: boolean };
  isLoading?: boolean;
}

// Indicator definitions
const INDICATOR_DEFINITIONS = {
  sma: {
    name: 'SMA',
    fullName: 'Simple Moving Average',
    description: 'The average price over a specified number of periods. Smooths out price fluctuations to identify trends.',
    icon: '📈',
    params: {
      period: { label: 'Period', description: 'Number of periods to average (e.g., 20, 50, 200)', type: 'number', default: 20, min: 1, max: 500 },
      source: { label: 'Price Source', description: 'Which price to use: close, open, high, or low', type: 'select', options: ['close', 'open', 'high', 'low'], default: 'close' }
    },
    conditions: [
      { value: 'above', label: 'Above Value', description: 'SMA is above a specific number' },
      { value: 'below', label: 'Below Value', description: 'SMA is below a specific number' },
      { value: 'aboveIndicator', label: 'Above Another SMA', description: 'SMA is above another SMA indicator' },
      { value: 'belowIndicator', label: 'Below Another SMA', description: 'SMA is below another SMA indicator' },
      { value: 'crossesAbove', label: 'Crosses Above', description: 'SMA crosses above another SMA or value' },
      { value: 'crossesBelow', label: 'Crosses Below', description: 'SMA crosses below another SMA or value' }
    ]
  },
  ema: {
    name: 'EMA',
    fullName: 'Exponential Moving Average',
    description: 'A type of moving average that gives more weight to recent prices, making it more responsive to price changes than SMA.',
    icon: '📊',
    params: {
      period: { label: 'Period', description: 'Number of periods to average (e.g., 12, 26, 50)', type: 'number', default: 20, min: 1, max: 500 },
      source: { label: 'Price Source', description: 'Which price to use: close, open, high, or low', type: 'select', options: ['close', 'open', 'high', 'low'], default: 'close' }
    },
    conditions: [
      { value: 'above', label: 'Above Value', description: 'EMA is above a specific number' },
      { value: 'below', label: 'Below Value', description: 'EMA is below a specific number' },
      { value: 'aboveIndicator', label: 'Above Another EMA/SMA', description: 'EMA is above another EMA or SMA indicator' },
      { value: 'belowIndicator', label: 'Below Another EMA/SMA', description: 'EMA is below another EMA or SMA indicator' },
      { value: 'crossesAbove', label: 'Crosses Above', description: 'EMA crosses above another EMA/SMA or value' },
      { value: 'crossesBelow', label: 'Crosses Below', description: 'EMA crosses below another EMA/SMA or value' }
    ]
  },
  rsi: {
    name: 'RSI',
    fullName: 'Relative Strength Index',
    description: 'A momentum oscillator that measures the speed and magnitude of price changes. Ranges from 0 to 100. Above 70 is typically overbought, below 30 is oversold.',
    icon: '⚡',
    params: {
      period: { label: 'Period', description: 'Number of periods for RSI calculation (typically 14)', type: 'number', default: 14, min: 2, max: 100 },
      source: { label: 'Price Source', description: 'Which price to use: close, open, high, or low', type: 'select', options: ['close', 'open', 'high', 'low'], default: 'close' }
    },
    conditions: [
      { value: 'above', label: 'Above Value', description: 'RSI is above a specific number (0-100)' },
      { value: 'below', label: 'Below Value', description: 'RSI is below a specific number (0-100)' },
      { value: 'overbought', label: 'Overbought', description: 'RSI is overbought (default: above 70)' },
      { value: 'oversold', label: 'Oversold', description: 'RSI is oversold (default: below 30)' },
      { value: 'crossesAbove', label: 'Crosses Above', description: 'RSI crosses above a threshold' },
      { value: 'crossesBelow', label: 'Crosses Below', description: 'RSI crosses below a threshold' }
    ]
  },
  macd: {
    name: 'MACD',
    fullName: 'Moving Average Convergence Divergence',
    description: 'A trend-following momentum indicator that shows the relationship between two moving averages. Consists of MACD line, signal line, and histogram.',
    icon: '🔄',
    params: {
      fastPeriod: { label: 'Fast Period', description: 'Period for fast EMA (typically 12)', type: 'number', default: 12, min: 1, max: 100 },
      slowPeriod: { label: 'Slow Period', description: 'Period for slow EMA (typically 26)', type: 'number', default: 26, min: 1, max: 200 },
      signalPeriod: { label: 'Signal Period', description: 'Period for signal line EMA (typically 9)', type: 'number', default: 9, min: 1, max: 50 }
    },
    conditions: [
      { value: 'signalAbove', label: 'Signal Above', description: 'MACD line is above signal line' },
      { value: 'signalBelow', label: 'Signal Below', description: 'MACD line is below signal line' },
      { value: 'crossesAboveSignal', label: 'Crosses Above Signal', description: 'MACD line crosses above signal line (bullish)' },
      { value: 'crossesBelowSignal', label: 'Crosses Below Signal', description: 'MACD line crosses below signal line (bearish)' },
      { value: 'histogramPositive', label: 'Histogram Positive', description: 'MACD histogram is positive' },
      { value: 'histogramNegative', label: 'Histogram Negative', description: 'MACD histogram is negative' }
    ]
  },
  bollingerBands: {
    name: 'BB',
    fullName: 'Bollinger Bands',
    description: 'A volatility indicator consisting of a middle band (SMA) and two outer bands (standard deviations). Price touching upper band may indicate overbought, lower band oversold.',
    icon: '📉',
    params: {
      period: { label: 'Period', description: 'Number of periods for SMA calculation (typically 20)', type: 'number', default: 20, min: 1, max: 200 },
      multiplier: { label: 'Multiplier', description: 'Number of standard deviations for bands (typically 2)', type: 'number', default: 2, min: 0.1, max: 5, step: 0.1 },
      source: { label: 'Price Source', description: 'Which price to use: close, open, high, or low', type: 'select', options: ['close', 'open', 'high', 'low'], default: 'close' }
    },
    conditions: [
      { value: 'priceAboveUpper', label: 'Price Above Upper Band', description: 'Current price is above upper Bollinger Band' },
      { value: 'priceBelowLower', label: 'Price Below Lower Band', description: 'Current price is below lower Bollinger Band' }
    ]
  },
  vwap: {
    name: 'VWAP',
    fullName: 'Volume Weighted Average Price',
    description: 'The average price a security has traded at throughout the day, based on both volume and price. Often used as a trading benchmark.',
    icon: '💰',
    params: {
      period: { label: 'Period', description: 'Number of periods (optional, uses all data if not specified)', type: 'number', default: undefined, min: 1, max: 1000, optional: true }
    },
    conditions: [
      { value: 'priceAbove', label: 'Price Above VWAP', description: 'Current price is above VWAP' },
      { value: 'priceBelow', label: 'Price Below VWAP', description: 'Current price is below VWAP' },
      { value: 'above', label: 'VWAP Above Value', description: 'VWAP is above a specific number' },
      { value: 'below', label: 'VWAP Below Value', description: 'VWAP is below a specific number' }
    ]
  }
};

type IndicatorType = keyof typeof INDICATOR_DEFINITIONS;
type LogicalOperator = 'and' | 'or' | 'not';

interface ChainItem {
  id: string;
  type: 'indicator' | 'operator';
  data?: {
    indicatorType?: IndicatorType;
    operator?: LogicalOperator;
    params?: Record<string, any>;
    condition?: string;
    value?: number | string;
    refIndicator?: { type: IndicatorType; params: Record<string, any> };
  };
}

// Convert ConditionNode to ChainItem array
const conditionNodeToChain = (node: ConditionNode, idPrefix: string = '', counter: { value: number } = { value: 0 }): ChainItem[] => {
  if (node.type === 'indicator' && node.indicator) {
    const id = `${idPrefix}${counter.value++}`;
    return [{
      id,
      type: 'indicator',
      data: {
        indicatorType: node.indicator.type,
        params: node.indicator.params,
        condition: node.indicator.condition,
        value: node.indicator.value,
        refIndicator: node.indicator.refIndicator
      }
    }];
  } else if (node.type === 'and' || node.type === 'or') {
    const items: ChainItem[] = [];
    // TypeScript doesn't narrow node.type properly, so we assert it's a LogicalOperator
    const operator: LogicalOperator = node.type === 'and' ? 'and' : 'or';
    node.children?.forEach((child, index) => {
      if (index > 0) {
        items.push({
          id: `${idPrefix}op-${counter.value++}`,
          type: 'operator',
          data: { operator }
        });
      }
      items.push(...conditionNodeToChain(child, `${idPrefix}`, counter));
    });
    return items;
  } else if (node.type === 'not' && node.children && node.children.length > 0) {
    return [
      {
        id: `${idPrefix}not-${counter.value++}`,
        type: 'operator',
        data: { operator: 'not' }
      },
      ...conditionNodeToChain(node.children[0], `${idPrefix}`, counter)
    ];
  }
  return [];
};

// Convert ChainItem array to ConditionNode
const chainToConditionNode = (chain: ChainItem[]): ConditionNode => {
  if (chain.length === 0) {
    return {
      type: 'indicator',
      indicator: { type: 'sma', params: { period: 20, source: 'close' }, condition: 'above', value: 0 }
    };
  }

  // Helper to convert a single indicator item
  const itemToIndicator = (item: ChainItem): ConditionNode => {
    if (item.type === 'indicator' && item.data?.indicatorType) {
      return {
        type: 'indicator',
        indicator: {
          type: item.data.indicatorType,
          params: item.data.params || {},
          condition: item.data.condition || 'above',
          value: item.data.value,
          refIndicator: item.data.refIndicator
        }
      };
    }
    return {
      type: 'indicator',
      indicator: { type: 'sma', params: { period: 20, source: 'close' }, condition: 'above', value: 0 }
    };
  };

  // Single item
  if (chain.length === 1) {
    const item = chain[0];
    if (item.type === 'operator' && item.data?.operator === 'not') {
      // NOT without operand - invalid, return default
      return itemToIndicator(item);
    }
    return itemToIndicator(item);
  }

  // Process chain: handle NOT operators first, then AND/OR
  const processed: (ConditionNode | { type: 'and' | 'or' })[] = [];
  let i = 0;

  while (i < chain.length) {
    const item = chain[i];
    
    if (item.type === 'operator' && item.data?.operator === 'not') {
      // NOT operator - wrap the next item
      if (i + 1 < chain.length) {
        const nextItem = chain[i + 1];
        if (nextItem.type === 'indicator') {
          processed.push({
            type: 'not',
            children: [itemToIndicator(nextItem)]
          });
          i += 2;
          continue;
        }
      }
      // Invalid NOT - skip it
      i++;
    } else if (item.type === 'operator' && (item.data?.operator === 'and' || item.data?.operator === 'or')) {
      // Store operator for later grouping
      processed.push({ type: item.data.operator });
      i++;
    } else if (item.type === 'indicator') {
      processed.push(itemToIndicator(item));
      i++;
    } else {
      i++;
    }
  }

  // Group by dominant operator (AND takes precedence over OR)
  let dominantOperator: 'and' | 'or' | null = null;
  for (let j = 0; j < processed.length; j++) {
    if ('type' in processed[j] && (processed[j].type === 'and' || processed[j].type === 'or')) {
      if (processed[j].type === 'and') {
        dominantOperator = 'and';
        break; // AND takes precedence
      } else if (!dominantOperator) {
        dominantOperator = 'or';
      }
    }
  }

  if (dominantOperator) {
    const children: ConditionNode[] = [];
    let currentGroup: ConditionNode[] = [];

    for (let j = 0; j < processed.length; j++) {
      const item = processed[j];
      if ('type' in item && (item.type === 'and' || item.type === 'or')) {
        if (item.type === dominantOperator) {
          // Same operator - continue grouping
          if (currentGroup.length > 0) {
            children.push(currentGroup.length === 1 ? currentGroup[0] : {
              type: dominantOperator,
              children: currentGroup
            });
            currentGroup = [];
          }
        } else {
          // Different operator - finalize current group
          if (currentGroup.length > 0) {
            children.push(currentGroup.length === 1 ? currentGroup[0] : {
              type: dominantOperator,
              children: currentGroup
            });
            currentGroup = [];
          }
        }
      } else {
        // Condition node
        currentGroup.push(item as ConditionNode);
      }
    }

    if (currentGroup.length > 0) {
      children.push(currentGroup.length === 1 ? currentGroup[0] : {
        type: dominantOperator,
        children: currentGroup
      });
    }

    return {
      type: dominantOperator,
      children: children.length > 0 ? children : [itemToIndicator(chain[0])]
    };
  }

  // No operators - single indicator or NOT
  if (processed.length === 1) {
    return processed[0] as ConditionNode;
  }

  // Multiple items without operators - default to AND
  const indicators = processed.filter(p => !('type' in p && (p.type === 'and' || p.type === 'or'))) as ConditionNode[];
  if (indicators.length > 1) {
    return {
      type: 'and',
      children: indicators
    };
  }

  return indicators[0] || itemToIndicator(chain[0]);
};

interface IndicatorTileProps {
  indicatorType: IndicatorType;
  onDragStart: (e: React.DragEvent, type: IndicatorType) => void;
  onClick: (type: IndicatorType) => void;
}

const IndicatorTile = ({ indicatorType, onDragStart, onClick }: IndicatorTileProps) => {
  const def = INDICATOR_DEFINITIONS[indicatorType];
  return (
    <Tooltip title={def.description} arrow placement="top">
      <Paper
        draggable
        onDragStart={(e) => onDragStart(e, indicatorType)}
        sx={{
          p: 2,
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' },
          '&:hover': { bgcolor: 'action.hover', transform: 'scale(1.02)' },
          transition: 'all 0.2s',
          border: '1px solid',
          borderColor: 'divider',
          position: 'relative'
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="h6">{def.icon}</Typography>
          <Box flex={1}>
            <Typography variant="subtitle2" fontWeight="bold">
              {def.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {def.fullName}
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onClick(indicatorType);
              }}
              sx={{
                color: 'primary.main',
                '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' }
              }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
            <DragIcon sx={{ color: 'text.secondary' }} />
          </Stack>
        </Stack>
      </Paper>
    </Tooltip>
  );
};

interface OperatorTileProps {
  operator: LogicalOperator;
  onDragStart: (e: React.DragEvent, operator: LogicalOperator) => void;
  onClick: (operator: LogicalOperator) => void;
}

const OperatorTile = ({ operator, onDragStart, onClick }: OperatorTileProps) => {
  const colors = {
    and: 'primary',
    or: 'secondary',
    not: 'error'
  } as const;

  return (
    <Tooltip title={`Logical ${operator.toUpperCase()} operator`} arrow>
      <Paper
        draggable
        onDragStart={(e) => onDragStart(e, operator)}
        sx={{
          p: 1.5,
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' },
          '&:hover': { bgcolor: 'action.hover', transform: 'scale(1.02)' },
          transition: 'all 0.2s',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: `${colors[operator]}.light`,
          color: `${colors[operator]}.contrastText`,
          position: 'relative'
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onClick(operator);
            }}
            sx={{
              color: 'inherit',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.2)' }
            }}
          >
            <AddIcon fontSize="small" />
          </IconButton>
          <Typography variant="h6" fontWeight="bold">
            {operator.toUpperCase()}
          </Typography>
          <DragIcon sx={{ color: 'inherit' }} />
        </Stack>
      </Paper>
    </Tooltip>
  );
};

interface ChainTileProps {
  item: ChainItem;
  onEdit: (item: ChainItem) => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent, item: ChainItem) => void;
  onDrop: (e: React.DragEvent, targetIndex: number) => void;
  index: number;
}

const ChainTile = ({ item, onEdit, onDelete, onDragStart, onDrop, index }: ChainTileProps) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    onDrop(e, index);
  };

  if (item.type === 'indicator' && item.data?.indicatorType) {
    const def = INDICATOR_DEFINITIONS[item.data.indicatorType];
    const conditionDef = def.conditions.find(c => c.value === item.data?.condition);
    
    return (
      <Paper
        draggable
        onDragStart={(e) => onDragStart(e, item)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          p: 1.5,
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' },
          border: '2px solid',
          borderColor: isDraggingOver ? 'primary.main' : 'divider',
          bgcolor: isDraggingOver ? 'action.selected' : 'background.paper',
          position: 'relative',
          '&:hover': { borderColor: 'primary.main' },
          minWidth: 180,
          flexShrink: 0
        }}
      >
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <DragIcon sx={{ color: 'text.secondary', fontSize: '1rem' }} />
            <Box flex={1}>
              <Typography variant="subtitle2" fontWeight="bold" noWrap>
                {def.icon} {def.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {conditionDef?.label || item.data.condition}
              </Typography>
            </Box>
          </Stack>
          {item.data.params && (
            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.65rem' }}>
              {Object.entries(item.data.params).slice(0, 2).map(([key, val]) => `${key}: ${val}`).join(', ')}
              {Object.keys(item.data.params).length > 2 ? '...' : ''}
            </Typography>
          )}
          <Stack direction="row" spacing={0.5} justifyContent="flex-end" sx={{ mt: 0.5 }}>
            <IconButton size="small" onClick={() => onEdit(item)} sx={{ p: 0.5 }}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={onDelete} color="error" sx={{ p: 0.5 }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>
      </Paper>
    );
  }

  if (item.type === 'operator' && item.data?.operator) {
    const colors = {
      and: 'primary',
      or: 'secondary',
      not: 'error'
    } as const;
    const op = item.data.operator;

    return (
      <Paper
        draggable
        onDragStart={(e) => onDragStart(e, item)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          p: 1,
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' },
          border: '2px solid',
          borderColor: isDraggingOver ? 'primary.main' : 'divider',
          bgcolor: isDraggingOver ? 'action.selected' : `${colors[op]}.light`,
          color: `${colors[op]}.contrastText`,
          position: 'relative',
          '&:hover': { borderColor: 'primary.main' },
          minWidth: 80,
          flexShrink: 0
        }}
      >
        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
          <DragIcon sx={{ color: 'inherit', fontSize: '1rem' }} />
          <Typography variant="subtitle2" fontWeight="bold">
            {op.toUpperCase()}
          </Typography>
          <IconButton size="small" onClick={() => onEdit(item)} sx={{ color: 'inherit', p: 0.25 }}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onDelete} sx={{ color: 'inherit', p: 0.25 }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Paper>
    );
  }

  return null;
};

interface EditIndicatorDialogProps {
  open: boolean;
  onClose: () => void;
  item: ChainItem | null;
  onSave: (item: ChainItem) => void;
}

const EditIndicatorDialog = ({ open, onClose, item, onSave }: EditIndicatorDialogProps) => {
  if (!item || !item.data?.indicatorType) return null;

  const def = INDICATOR_DEFINITIONS[item.data.indicatorType];
  const [params, setParams] = useState(item.data.params || {});
  const [condition, setCondition] = useState(item.data.condition || def.conditions[0].value);
  const [value, setValue] = useState<number | string | undefined>(item.data.value);
  const [refIndicator, setRefIndicator] = useState(item.data.refIndicator);

  const handleSave = () => {
    onSave({
      ...item,
      data: {
        ...item.data,
        params,
        condition,
        value,
        refIndicator
      }
    });
    onClose();
  };

  return (
    <MuiDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <MuiDialogTitle>
        Edit {def.fullName}
      </MuiDialogTitle>
      <MuiDialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {Object.entries(def.params).map(([key, param]) => (
            <TextField
              key={key}
              label={param.label}
              type={param.type === 'number' ? 'number' : 'text'}
              value={params[key] ?? param.default ?? ''}
              onChange={(e) => {
                const newParams = { ...params };
                if (param.type === 'number') {
                  newParams[key] = parseFloat(e.target.value) || param.default;
                } else if (param.type === 'select') {
                  newParams[key] = e.target.value;
                }
                setParams(newParams);
              }}
              select={param.type === 'select'}
              fullWidth
              size="small"
              helperText={param.description}
              InputProps={param.type === 'number' ? {
                inputProps: { min: param.min, max: param.max, step: param.step || 1 }
              } : undefined}
            >
              {param.type === 'select' && param.options?.map(opt => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </TextField>
          ))}

          <FormControl fullWidth size="small">
            <InputLabel>Condition</InputLabel>
            <Select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              label="Condition"
            >
              {def.conditions.map(cond => (
                <MenuItem key={cond.value} value={cond.value}>
                  <Box>
                    <Typography variant="body2">{cond.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {cond.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {(condition === 'above' || condition === 'below' || condition === 'overbought' || condition === 'oversold') && (
            <TextField
              label="Threshold Value"
              type="number"
              value={value ?? ''}
              onChange={(e) => setValue(parseFloat(e.target.value) || undefined)}
              fullWidth
              size="small"
              helperText="Enter a numeric threshold value"
            />
          )}

          {(condition === 'aboveIndicator' || condition === 'belowIndicator' ||
            condition === 'crossesAbove' || condition === 'crossesBelow') && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Reference Indicator
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>Indicator Type</InputLabel>
                <Select
                  value={refIndicator?.type || 'sma'}
                  onChange={(e) => {
                    const refType = e.target.value as IndicatorType;
                    const refDef = INDICATOR_DEFINITIONS[refType];
                    const refParams: Record<string, any> = {};
                    Object.keys(refDef.params).forEach(key => {
                      refParams[key] = refDef.params[key].default;
                    });
                    setRefIndicator({ type: refType, params: refParams });
                  }}
                  label="Indicator Type"
                >
                  {Object.keys(INDICATOR_DEFINITIONS).map(type => (
                    <MenuItem key={type} value={type}>
                      {INDICATOR_DEFINITIONS[type as IndicatorType].fullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {refIndicator && Object.entries(INDICATOR_DEFINITIONS[refIndicator.type].params).map(([key, param]) => (
                <TextField
                  key={key}
                  label={param.label}
                  type={param.type === 'number' ? 'number' : 'text'}
                  value={refIndicator.params[key] ?? param.default ?? ''}
                  onChange={(e) => {
                    const newRefParams = { ...refIndicator.params };
                    if (param.type === 'number') {
                      newRefParams[key] = parseFloat(e.target.value) || param.default;
                    } else if (param.type === 'select') {
                      newRefParams[key] = e.target.value;
                    }
                    setRefIndicator({ ...refIndicator, params: newRefParams });
                  }}
                  select={param.type === 'select'}
                  fullWidth
                  size="small"
                  sx={{ mb: 1 }}
                  InputProps={param.type === 'number' ? {
                    inputProps: { min: param.min, max: param.max, step: param.step || 1 }
                  } : undefined}
                >
                  {param.type === 'select' && param.options?.map(opt => (
                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                  ))}
                </TextField>
              ))}
            </Box>
          )}
        </Stack>
      </MuiDialogContent>
      <MuiDialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </MuiDialogActions>
    </MuiDialog>
  );
};

interface EditOperatorDialogProps {
  open: boolean;
  onClose: () => void;
  item: ChainItem | null;
  onSave: (operator: LogicalOperator) => void;
}

const EditOperatorDialog = ({ open, onClose, item, onSave }: EditOperatorDialogProps) => {
  const [operator, setOperator] = useState<LogicalOperator>(item?.data?.operator || 'and');

  const handleSave = () => {
    onSave(operator);
    onClose();
  };

  return (
    <MuiDialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <MuiDialogTitle>Edit Logical Operator</MuiDialogTitle>
      <MuiDialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Operator</InputLabel>
            <Select
              value={operator}
              onChange={(e) => setOperator(e.target.value as LogicalOperator)}
              label="Operator"
            >
              <MenuItem value="and">AND - All conditions must be true</MenuItem>
              <MenuItem value="or">OR - At least one condition must be true</MenuItem>
              <MenuItem value="not">NOT - Condition must be false</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </MuiDialogContent>
      <MuiDialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">Save</Button>
      </MuiDialogActions>
    </MuiDialog>
  );
};

interface ConditionChainProps {
  chain: ChainItem[];
  onChainChange: (chain: ChainItem[]) => void;
  title: string;
  emptyMessage: string;
  onAddIndicator?: (indicatorType: IndicatorType) => void;
  onAddOperator?: (operator: LogicalOperator) => void;
}

const ConditionChain = ({
  chain,
  onChainChange,
  title,
  emptyMessage
}: ConditionChainProps) => {
  const [draggedItem, setDraggedItem] = useState<ChainItem | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<ChainItem | null>(null);
  const [isEditOperator, setIsEditOperator] = useState(false);

  const handleDragStart = (e: React.DragEvent, item: ChainItem, index: number) => {
    setDraggedItem(item);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedItem && draggedIndex !== null) {
      const newChain = [...chain];
      newChain.splice(draggedIndex, 1);
      newChain.splice(targetIndex, 0, draggedItem);
      onChainChange(newChain);
    }
    setDraggedItem(null);
    setDraggedIndex(null);
  };

  const handleDropFromPalette = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      const item = JSON.parse(data);
      const newChain = [...chain];
      newChain.splice(targetIndex, 0, item);
      onChainChange(newChain);
    }
  };

  const handleDelete = (index: number) => {
    const newChain = chain.filter((_, i) => i !== index);
    onChainChange(newChain);
  };

  const handleEdit = (item: ChainItem) => {
    setEditingItem(item);
    setIsEditOperator(item.type === 'operator');
  };

  const handleSaveEdit = (updatedItem: ChainItem | LogicalOperator) => {
    if (typeof updatedItem === 'string') {
      // Operator change
      const index = chain.findIndex(item => item.id === editingItem?.id);
      if (index >= 0) {
        const newChain = [...chain];
        newChain[index] = {
          ...newChain[index],
          data: { ...newChain[index].data, operator: updatedItem }
        };
        onChainChange(newChain);
      }
    } else {
      // Indicator update
      const index = chain.findIndex(item => item.id === updatedItem.id);
      if (index >= 0) {
        const newChain = [...chain];
        newChain[index] = updatedItem;
        onChainChange(newChain);
      }
    }
    setEditingItem(null);
    setIsEditOperator(false);
  };

  const handleDropZoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/json');
    if (data) {
      const item = JSON.parse(data);
      onChainChange([...chain, item]);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Paper
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDropZoneDrop}
        sx={{
          minHeight: 120,
          p: 2,
          border: '2px dashed',
          borderColor: 'divider',
          bgcolor: 'action.hover',
          display: 'flex',
          flexDirection: 'row',
          gap: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          '&::-webkit-scrollbar': {
            height: 8
          },
          '&::-webkit-scrollbar-track': {
            bgcolor: 'action.hover'
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'divider',
            borderRadius: 1,
            '&:hover': {
              bgcolor: 'text.secondary'
            }
          }
        }}
      >
        {chain.length === 0 ? (
          <Box 
            textAlign="center" 
            py={4} 
            sx={{ 
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {emptyMessage}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Drag indicators and operators here, or click the + icon to add them
            </Typography>
          </Box>
        ) : (
          chain.map((item, index) => (
            <ChainTile
              key={item.id}
              item={item}
              onEdit={() => handleEdit(item)}
              onDelete={() => handleDelete(index)}
              onDragStart={(e) => handleDragStart(e, item, index)}
              onDrop={(e) => {
                const data = e.dataTransfer.getData('application/json');
                if (data) {
                  handleDropFromPalette(e, index);
                } else {
                  handleDrop(e, index);
                }
              }}
              index={index}
            />
          ))
        )}
      </Paper>

      <EditIndicatorDialog
        open={!isEditOperator && editingItem !== null}
        onClose={() => {
          setEditingItem(null);
          setIsEditOperator(false);
        }}
        item={editingItem}
        onSave={handleSaveEdit as (item: ChainItem) => void}
      />

      <EditOperatorDialog
        open={isEditOperator && editingItem !== null}
        onClose={() => {
          setEditingItem(null);
          setIsEditOperator(false);
        }}
        item={editingItem}
        onSave={(op) => handleSaveEdit(op)}
      />
    </Box>
  );
};

const steps = ['Buy Conditions', 'Sell Conditions', 'Strategy Details'];

const CustomStrategyBuilder = ({
  open,
  onClose,
  onSave,
  editingStrategy,
  isLoading = false
}: CustomStrategyBuilderProps) => {
  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [buyChain, setBuyChain] = useState<ChainItem[]>([]);
  const [sellChain, setSellChain] = useState<ChainItem[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Update state when editingStrategy changes or dialog opens
  useEffect(() => {
    if (open) {
      if (editingStrategy) {
        // Edit mode - populate with existing strategy data
        setName(editingStrategy.name || '');
        setDescription(editingStrategy.description || '');
        setIsPublic(editingStrategy.is_public || false);
        setActiveStep(0); // Start at first step when editing

        // Load buy conditions
        if (editingStrategy.buy_conditions) {
          const buyNode = Array.isArray(editingStrategy.buy_conditions) 
            ? editingStrategy.buy_conditions[0] 
            : editingStrategy.buy_conditions;
          setBuyChain(conditionNodeToChain(buyNode, 'buy-'));
        } else {
          setBuyChain([]);
        }

        // Load sell conditions
        if (editingStrategy.sell_conditions) {
          const sellNode = Array.isArray(editingStrategy.sell_conditions)
            ? editingStrategy.sell_conditions[0]
            : editingStrategy.sell_conditions;
          setSellChain(conditionNodeToChain(sellNode, 'sell-'));
        } else {
          setSellChain([]);
        }
      } else {
        // Create mode - reset to empty state
        setName('');
        setDescription('');
        setIsPublic(false);
        setActiveStep(0);
        setBuyChain([]);
        setSellChain([]);
      }
      // Clear validation state when opening
      setValidationErrors([]);
      setValidationWarnings([]);
    }
  }, [open, editingStrategy]);

  const handleIndicatorDragStart = (e: React.DragEvent, indicatorType: IndicatorType) => {
    const def = INDICATOR_DEFINITIONS[indicatorType];
    const defaultParams: Record<string, any> = {};
    Object.keys(def.params).forEach(key => {
      defaultParams[key] = def.params[key].default;
    });

    const item: ChainItem = {
      id: `new-${Date.now()}`,
      type: 'indicator',
      data: {
        indicatorType,
        params: defaultParams,
        condition: def.conditions[0].value
      }
    };

    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleOperatorDragStart = (e: React.DragEvent, operator: LogicalOperator) => {
    const item: ChainItem = {
      id: `new-op-${Date.now()}`,
      type: 'operator',
      data: { operator }
    };

    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
  };

  const createIndicatorItem = (indicatorType: IndicatorType): ChainItem => {
    const def = INDICATOR_DEFINITIONS[indicatorType];
    const defaultParams: Record<string, any> = {};
    Object.keys(def.params).forEach(key => {
      defaultParams[key] = def.params[key].default;
    });

    return {
      id: `new-${Date.now()}-${Math.random()}`,
      type: 'indicator',
      data: {
        indicatorType,
        params: defaultParams,
        condition: def.conditions[0].value
      }
    };
  };

  const createOperatorItem = (operator: LogicalOperator): ChainItem => {
    return {
      id: `new-op-${Date.now()}-${Math.random()}`,
      type: 'operator',
      data: { operator }
    };
  };

  const handleAddIndicatorToBuy = (indicatorType: IndicatorType) => {
    setBuyChain([...buyChain, createIndicatorItem(indicatorType)]);
  };

  const handleAddIndicatorToSell = (indicatorType: IndicatorType) => {
    setSellChain([...sellChain, createIndicatorItem(indicatorType)]);
  };

  const handleAddOperatorToBuy = (operator: LogicalOperator) => {
    setBuyChain([...buyChain, createOperatorItem(operator)]);
  };

  const handleAddOperatorToSell = (operator: LogicalOperator) => {
    setSellChain([...sellChain, createOperatorItem(operator)]);
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate buy conditions
      if (buyChain.length === 0) {
        alert('Please add at least one buy condition before continuing');
        return;
      }
    } else if (activeStep === 1) {
      // Validate sell conditions
      if (sellChain.length === 0) {
        alert('Please add at least one sell condition before continuing');
        return;
      }
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleValidate = async () => {
    if (buyChain.length === 0 || sellChain.length === 0) {
      return { valid: false, errors: [], warnings: [] };
    }

    setIsValidating(true);
    try {
      const buyConditions = chainToConditionNode(buyChain);
      const sellConditions = chainToConditionNode(sellChain);

      const response = await validateCustomStrategy({
        buy_conditions: buyConditions,
        sell_conditions: sellConditions
      });

      console.log('Validation response:', response.data);

      // Handle both response structures for compatibility
      // API returns: { success: true, data: { valid, errors, warnings } }
      // Or old format: { success: true, valid, errors, warnings }
      const responseData = response.data;
      let validation;
      
      if (responseData.data) {
        // New format with data wrapper
        validation = responseData.data;
      } else if (responseData.valid !== undefined || responseData.errors !== undefined) {
        // Old format or direct format
        validation = responseData;
      } else {
        console.error('Unexpected validation response format:', responseData);
        throw new Error('Invalid validation response format');
      }
      
      const errors = Array.isArray(validation.errors) ? validation.errors : [];
      const warnings = Array.isArray(validation.warnings) ? validation.warnings : [];
      const valid = validation.valid !== undefined ? validation.valid : (errors.length === 0);
      
      console.log('Parsed validation:', { valid, errors, warnings });
      
      // Always set the state, even if arrays are empty (to clear previous errors)
      setValidationErrors(errors);
      setValidationWarnings(warnings);
      
      return { valid, errors, warnings };
    } catch (error: any) {
      console.error('Error validating strategy:', error);
      console.error('Error response:', error?.response?.data);
      
      // Check if it's actually a validation response with errors (non-200 status)
      if (error?.response?.data) {
        const errorData = error.response.data;
        // Check if it has validation data
        if (errorData.data && (errorData.data.errors !== undefined || errorData.data.warnings !== undefined)) {
          const validation = errorData.data;
          setValidationErrors(validation.errors || []);
          setValidationWarnings(validation.warnings || []);
          return validation;
        }
        // Check if it's the old format
        if (errorData.valid !== undefined || errorData.errors !== undefined) {
          setValidationErrors(errorData.errors || []);
          setValidationWarnings(errorData.warnings || []);
          return { valid: errorData.valid || false, errors: errorData.errors || [], warnings: errorData.warnings || [] };
        }
      }
      
      // Otherwise it's a real error
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to validate strategy';
      setValidationErrors([errorMsg]);
      setValidationWarnings([]);
      return { valid: false, errors: [errorMsg], warnings: [] };
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Please enter a strategy name');
      return;
    }

    if (buyChain.length === 0) {
      alert('Please add at least one buy condition');
      return;
    }

    if (sellChain.length === 0) {
      alert('Please add at least one sell condition');
      return;
    }

    // Validate before saving
    const validation = await handleValidate();
    if (!validation.valid) {
      const errorMessage = validation.errors.length > 0
        ? `Validation failed:\n${validation.errors.join('\n')}`
        : 'Strategy validation failed. Please review your conditions.';
      
      if (validation.errors.length > 0) {
        alert(errorMessage);
        return;
      }
    }

    // If there are errors, don't proceed
    if (validationErrors.length > 0) {
      const proceed = window.confirm(
        `Your strategy has validation errors:\n${validationErrors.join('\n')}\n\nDo you want to save anyway?`
      );
      if (!proceed) {
        return;
      }
    }

    try {
      const buyConditions = chainToConditionNode(buyChain);
      const sellConditions = chainToConditionNode(sellChain);

      await onSave({
        name: name.trim(),
        description: description.trim() || undefined,
        buy_conditions: buyConditions,
        sell_conditions: sellConditions,
        is_public: isPublic
      });
      handleClose();
    } catch (error) {
      console.error('Error saving strategy:', error);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setActiveStep(0);
    setName('');
    setDescription('');
    setIsPublic(false);
    setBuyChain([]);
    setSellChain([]);
    setValidationErrors([]);
    setValidationWarnings([]);
    onClose();
  };

  // Validate when moving to final step
  useEffect(() => {
    if (activeStep === 2 && buyChain.length > 0 && sellChain.length > 0) {
      handleValidate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep]);

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Buy Conditions
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Define Buy Conditions
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Build the conditions that will trigger a buy signal. Drag indicators and operators from the palette below, or click the + icon to add them.
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Available Indicators
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {Object.keys(INDICATOR_DEFINITIONS).map(type => (
                  <Grid item xs={6} sm={4} md={3} key={type}>
                    <IndicatorTile
                      indicatorType={type as IndicatorType}
                      onDragStart={handleIndicatorDragStart}
                      onClick={handleAddIndicatorToBuy}
                    />
                  </Grid>
                ))}
              </Grid>

              <Typography variant="subtitle1" gutterBottom>
                Logical Operators
              </Typography>
              <Stack direction="row" spacing={2}>
                <OperatorTile 
                  operator="and" 
                  onDragStart={handleOperatorDragStart}
                  onClick={handleAddOperatorToBuy}
                />
                <OperatorTile 
                  operator="or" 
                  onDragStart={handleOperatorDragStart}
                  onClick={handleAddOperatorToBuy}
                />
                <OperatorTile 
                  operator="not" 
                  onDragStart={handleOperatorDragStart}
                  onClick={handleAddOperatorToBuy}
                />
              </Stack>
            </Box>

            <ConditionChain
              chain={buyChain}
              onChainChange={setBuyChain}
              title="Buy Conditions Chain"
              emptyMessage="Drag indicators here to define when to buy"
              onAddIndicator={handleAddIndicatorToBuy}
              onAddOperator={handleAddOperatorToBuy}
            />
          </Box>
        );

      case 1: // Sell Conditions
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Define Sell Conditions
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Build the conditions that will trigger a sell signal. Drag indicators and operators from the palette below, or click the + icon to add them.
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Available Indicators
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {Object.keys(INDICATOR_DEFINITIONS).map(type => (
                  <Grid item xs={6} sm={4} md={3} key={type}>
                    <IndicatorTile
                      indicatorType={type as IndicatorType}
                      onDragStart={handleIndicatorDragStart}
                      onClick={handleAddIndicatorToSell}
                    />
                  </Grid>
                ))}
              </Grid>

              <Typography variant="subtitle1" gutterBottom>
                Logical Operators
              </Typography>
              <Stack direction="row" spacing={2}>
                <OperatorTile 
                  operator="and" 
                  onDragStart={handleOperatorDragStart}
                  onClick={handleAddOperatorToSell}
                />
                <OperatorTile 
                  operator="or" 
                  onDragStart={handleOperatorDragStart}
                  onClick={handleAddOperatorToSell}
                />
                <OperatorTile 
                  operator="not" 
                  onDragStart={handleOperatorDragStart}
                  onClick={handleAddOperatorToSell}
                />
              </Stack>
            </Box>

            <ConditionChain
              chain={sellChain}
              onChainChange={setSellChain}
              title="Sell Conditions Chain"
              emptyMessage="Drag indicators here to define when to sell"
              onAddIndicator={handleAddIndicatorToSell}
              onAddOperator={handleAddOperatorToSell}
            />
          </Box>
        );

      case 2: // Strategy Details
        return (
          <Box>
            {/* Visual Summary */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Strategy Summary
              </Typography>
              <Stack spacing={2}>
                {/* Buy Conditions Summary */}
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Buy Conditions
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 0.5,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      minHeight: 40,
                      p: 1,
                      bgcolor: 'action.hover',
                      borderRadius: 1
                    }}
                  >
                    {buyChain.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No buy conditions defined
                      </Typography>
                    ) : (
                      buyChain.map((item) => {
                        if (item.type === 'indicator' && item.data?.indicatorType) {
                          const def = INDICATOR_DEFINITIONS[item.data.indicatorType];
                          const conditionDef = def.conditions.find(c => c.value === item.data?.condition);
                          const params = item.data.params || {};
                          const paramStr = Object.entries(params)
                            .slice(0, 2)
                            .map(([key, val]) => `${key}: ${val}`)
                            .join(', ');
                          
                          return (
                            <Tooltip
                              key={item.id}
                              title={
                                <Box>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    {def.fullName}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    Condition: {conditionDef?.label || item.data.condition}
                                  </Typography>
                                  {paramStr && (
                                    <Typography variant="caption" display="block">
                                      Params: {paramStr}
                                    </Typography>
                                  )}
                                  {item.data.value !== undefined && (
                                    <Typography variant="caption" display="block">
                                      Value: {item.data.value}
                                    </Typography>
                                  )}
                                </Box>
                              }
                              arrow
                            >
                              <Chip
                                icon={<Typography variant="body2">{def.icon}</Typography>}
                                label={def.name}
                                size="small"
                                sx={{
                                  bgcolor: 'primary.light',
                                  color: 'primary.contrastText',
                                  '&:hover': { bgcolor: 'primary.main' }
                                }}
                              />
                            </Tooltip>
                          );
                        } else if (item.type === 'operator' && item.data?.operator) {
                          const colors = {
                            and: 'primary',
                            or: 'secondary',
                            not: 'error'
                          } as const;
                          const op = item.data.operator;
                          
                          return (
                            <Tooltip
                              key={item.id}
                              title={`Logical ${op.toUpperCase()} operator`}
                              arrow
                            >
                              <Chip
                                label={op.toUpperCase()}
                                size="small"
                                sx={{
                                  bgcolor: `${colors[op]}.light`,
                                  color: `${colors[op]}.contrastText`,
                                  fontWeight: 'bold',
                                  minWidth: 40
                                }}
                              />
                            </Tooltip>
                          );
                        }
                        return null;
                      })
                    )}
                  </Box>
                </Box>

                {/* Sell Conditions Summary */}
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Sell Conditions
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      gap: 0.5,
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      minHeight: 40,
                      p: 1,
                      bgcolor: 'action.hover',
                      borderRadius: 1
                    }}
                  >
                    {sellChain.length === 0 ? (
                      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        No sell conditions defined
                      </Typography>
                    ) : (
                      sellChain.map((item) => {
                        if (item.type === 'indicator' && item.data?.indicatorType) {
                          const def = INDICATOR_DEFINITIONS[item.data.indicatorType];
                          const conditionDef = def.conditions.find(c => c.value === item.data?.condition);
                          const params = item.data.params || {};
                          const paramStr = Object.entries(params)
                            .slice(0, 2)
                            .map(([key, val]) => `${key}: ${val}`)
                            .join(', ');
                          
                          return (
                            <Tooltip
                              key={item.id}
                              title={
                                <Box>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    {def.fullName}
                                  </Typography>
                                  <Typography variant="caption" display="block">
                                    Condition: {conditionDef?.label || item.data.condition}
                                  </Typography>
                                  {paramStr && (
                                    <Typography variant="caption" display="block">
                                      Params: {paramStr}
                                    </Typography>
                                  )}
                                  {item.data.value !== undefined && (
                                    <Typography variant="caption" display="block">
                                      Value: {item.data.value}
                                    </Typography>
                                  )}
                                </Box>
                              }
                              arrow
                            >
                              <Chip
                                icon={<Typography variant="body2">{def.icon}</Typography>}
                                label={def.name}
                                size="small"
                                sx={{
                                  bgcolor: 'error.light',
                                  color: 'error.contrastText',
                                  '&:hover': { bgcolor: 'error.main' }
                                }}
                              />
                            </Tooltip>
                          );
                        } else if (item.type === 'operator' && item.data?.operator) {
                          const colors = {
                            and: 'primary',
                            or: 'secondary',
                            not: 'error'
                          } as const;
                          const op = item.data.operator;
                          
                          return (
                            <Tooltip
                              key={item.id}
                              title={`Logical ${op.toUpperCase()} operator`}
                              arrow
                            >
                              <Chip
                                label={op.toUpperCase()}
                                size="small"
                                sx={{
                                  bgcolor: `${colors[op]}.light`,
                                  color: `${colors[op]}.contrastText`,
                                  fontWeight: 'bold',
                                  minWidth: 40
                                }}
                              />
                            </Tooltip>
                          );
                        }
                        return null;
                      })
                    )}
                  </Box>
                </Box>
              </Stack>
            </Paper>

            {/* Validation Disclaimer */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                Strategy Validation
              </Typography>
              <Typography variant="body2">
                We will attempt to validate your strategy for logical consistency and common issues. 
                However, please verify that your strategy makes sense for your trading goals before proceeding. 
                Always test your strategy thoroughly before using it with real money.
              </Typography>
            </Alert>

            {/* Validation Results */}
            {validationErrors.length > 0 && validationErrors.some(err => err && err.trim().length > 0) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Validation Errors
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {validationErrors.filter(err => err && err.trim().length > 0).map((error, index) => (
                    <li key={index}>
                      <Typography variant="body2">{error}</Typography>
                    </li>
                  ))}
                </ul>
              </Alert>
            )}

            {validationWarnings.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  Validation Warnings
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {validationWarnings.map((warning, index) => (
                    <li key={index}>
                      <Typography variant="body2">{warning}</Typography>
                    </li>
                  ))}
                </ul>
              </Alert>
            )}

            {isValidating && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">Validating strategy...</Typography>
              </Alert>
            )}

            <Typography variant="h6" gutterBottom>
              Strategy Details
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Give your strategy a name and description. You can also choose to make it public so other users can use it in the marketplace.
            </Typography>

            <Stack spacing={3} sx={{ mt: 2 }}>
              <TextField
                label="Strategy Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                required
                helperText="Give your strategy a descriptive name"
              />

              <TextField
                label="Description (Optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={4}
                helperText="Describe what this strategy does and when it's best used"
              />

              <Paper sx={{ p: 2, bgcolor: 'action.hover' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        Make Strategy Public
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Public strategies will be available in the marketplace for other users to discover and use. Private strategies are only visible to you.
                      </Typography>
                    </Box>
                  }
                />
              </Paper>

              {isPublic && (
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Public Strategy:</strong> This strategy will be visible to all users in the marketplace. 
                    They will be able to view and use your strategy, but you will remain the owner.
                  </Typography>
                </Alert>
              )}
            </Stack>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Stack spacing={2}>
          <Typography variant="h5">
            {editingStrategy ? 'Edit Custom Strategy' : 'Create Custom Strategy'}
          </Typography>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ minHeight: 500 }}>
        {renderStepContent()}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Stack direction="row" spacing={2}>
          <Button
            disabled={activeStep === 0 || isLoading}
            onClick={handleBack}
            startIcon={<ArrowBackIcon />}
          >
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button
              onClick={handleSave}
              variant="contained"
              disabled={isLoading || !name.trim() || buyChain.length === 0 || sellChain.length === 0}
              startIcon={isLoading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
            >
              {isLoading ? 'Saving...' : editingStrategy ? 'Update Strategy' : 'Create Strategy'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<ArrowForwardIcon />}
            >
              Next
            </Button>
          )}
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default CustomStrategyBuilder;

