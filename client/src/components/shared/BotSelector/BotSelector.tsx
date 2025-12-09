import React from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Button,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  Stack,
} from '@mui/material';
import {
  Settings,
  Psychology,
  Add,
} from '@mui/icons-material';
import { UserStrategy } from '../../../api';
import { CustomStrategy } from '../../../api/customStrategiesApi';

// Unified strategy type for display
export type UnifiedStrategy = {
  id: number;
  name: string;
  description?: string;
  type: 'user' | 'custom';
  strategy_type?: string; // For user strategies
  is_active: boolean;
  is_public?: boolean;
  config?: any; // For user strategies
  buy_conditions?: any; // For custom strategies
  sell_conditions?: any; // For custom strategies
  original: UserStrategy | CustomStrategy;
};

export interface BotSelectorProps {
  userStrategies?: UserStrategy[];
  customStrategies?: CustomStrategy[];
  isLoading?: boolean;
  selectedStrategy?: UnifiedStrategy | null;
  onStrategySelect: (strategy: UnifiedStrategy) => void;
  title?: string;
  description?: string;
  emptyStateTitle?: string;
  emptyStateMessage?: string;
  emptyStateButtonLabel?: string;
  onEmptyStateButtonClick?: () => void;
  showActiveOnly?: boolean;
}

export const BotSelector: React.FC<BotSelectorProps> = ({
  userStrategies = [],
  customStrategies = [],
  isLoading = false,
  selectedStrategy,
  onStrategySelect,
  title = 'Select Trading Bot',
  description = 'Choose one of your saved bots. All bot creation and editing happens in the Program Bot page.',
  emptyStateTitle = 'No Bots Available',
  emptyStateMessage = 'You haven\'t created any trading bots yet. Create your first bot to get started.',
  emptyStateButtonLabel = 'Create Bot',
  onEmptyStateButtonClick,
  showActiveOnly = true,
}) => {
  // Combine strategies into unified format
  const allStrategies: UnifiedStrategy[] = React.useMemo(() => {
    const user: UnifiedStrategy[] = (userStrategies || [])
      .filter(s => !showActiveOnly || s.is_active)
      .map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        type: 'user' as const,
        strategy_type: s.strategy_type,
        is_active: s.is_active,
        is_public: s.is_public,
        config: s.config,
        original: s,
      }));

    const custom: UnifiedStrategy[] = (customStrategies || [])
      .filter(s => !showActiveOnly || s.is_active)
      .map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        type: 'custom' as const,
        is_active: s.is_active,
        is_public: s.is_public,
        buy_conditions: s.buy_conditions,
        sell_conditions: s.sell_conditions,
        original: s,
      }));

    return [...user, ...custom];
  }, [userStrategies, customStrategies, showActiveOnly]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
        {title}
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        {description}
      </Typography>

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : allStrategies.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Psychology sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {emptyStateTitle}
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            {emptyStateMessage}
          </Typography>
          {onEmptyStateButtonClick && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={onEmptyStateButtonClick}
              sx={{ mt: 2 }}
            >
              {emptyStateButtonLabel}
            </Button>
          )}
        </Paper>
      ) : (
        <Stack spacing={2}>
          {allStrategies.map((strategy) => (
            <Card
              key={`${strategy.type}-${strategy.id}`}
              sx={{
                border: selectedStrategy?.id === strategy.id && selectedStrategy?.type === strategy.type ? 2 : 1,
                borderColor: selectedStrategy?.id === strategy.id && selectedStrategy?.type === strategy.type ? 'primary.main' : 'divider',
                backgroundColor: selectedStrategy?.id === strategy.id && selectedStrategy?.type === strategy.type ? 'action.selected' : 'background.paper',
              }}
            >
              <CardActionArea onClick={() => onStrategySelect(strategy)}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" component="div">
                      {strategy.name}
                    </Typography>
                    <Chip
                      label={strategy.type === 'custom' ? 'Custom' : (strategy.strategy_type || 'Strategy')}
                      size="small"
                      color={strategy.type === 'custom' ? 'secondary' : 'primary'}
                      variant="outlined"
                    />
                  </Box>
                  {strategy.description && (
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {strategy.description}
                    </Typography>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                    <Chip
                      label={strategy.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      color={strategy.is_active ? 'success' : 'default'}
                      variant="outlined"
                    />
                    {strategy.is_public && (
                      <Chip
                        label="Public"
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    )}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

