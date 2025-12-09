import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  CardActionArea,
  Chip,
  IconButton,
  Button,
  Tooltip,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  PlayArrow as ActivateIcon,
  Pause as DeactivateIcon,
  Public as PublicIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { UserStrategy } from '../../../api';
import { CustomStrategy } from '../../../api/customStrategiesApi';
import { RobotAvatarDisplay } from '../RobotAvatars';
import { UnifiedStrategy } from '../BotSelector';

export interface BotCardProps {
  strategy: UserStrategy | CustomStrategy | UnifiedStrategy;
  size?: 'normal' | 'compact';
  mode?: 'display' | 'selectable' | 'withActions';
  selected?: boolean;
  showBacktestResults?: boolean;
  onSelect?: (strategy: UserStrategy | CustomStrategy | UnifiedStrategy) => void;
  onEdit?: (strategy: UserStrategy | CustomStrategy) => void;
  onToggleActive?: (strategy: UserStrategy | CustomStrategy) => void;
  onMenuClick?: (event: React.MouseEvent<HTMLElement>, strategy: UserStrategy | CustomStrategy) => void;
  getStrategyTypeLabel?: (type: string) => string;
  formatDate?: (dateString: string) => string;
  isCustom?: boolean;
  borderColor?: string;
}

const BotCard: React.FC<BotCardProps> = ({
  strategy,
  size = 'normal',
  mode = 'display',
  selected = false,
  showBacktestResults = true,
  onSelect,
  onEdit,
  onToggleActive,
  onMenuClick,
  getStrategyTypeLabel,
  formatDate,
  isCustom = false,
  borderColor,
}) => {
  // Determine if this is a UnifiedStrategy, UserStrategy, or CustomStrategy
  const isUnified = 'type' in strategy && (strategy.type === 'user' || strategy.type === 'custom');
  const isUserStrategy = !isUnified && 'strategy_type' in strategy;
  const isCustomStrategy = !isUnified && 'buy_conditions' in strategy;

  // Extract common properties
  const name = strategy.name;
  const description = strategy.description;
  const isActive = strategy.is_active;
  const isPublic = 'is_public' in strategy ? strategy.is_public : false;
  const avatar = strategy.avatar;
  
  // Get created_at - for UnifiedStrategy, get it from original
  let createdAt = '';
  if (isUnified) {
    const original = (strategy as UnifiedStrategy).original;
    createdAt = 'created_at' in original ? original.created_at : '';
  } else {
    createdAt = 'created_at' in strategy ? strategy.created_at : '';
  }

  // Get strategy type
  let strategyType: string = 'Custom Strategy';
  if (isUnified) {
    strategyType = strategy.type === 'custom' ? 'Custom Strategy' : (strategy.strategy_type || 'Strategy');
  } else if (isUserStrategy) {
    strategyType = (strategy as UserStrategy).strategy_type;
  }

  // Get backtest results
  const getBacktestResults = (strategy: UserStrategy | CustomStrategy | UnifiedStrategy) => {
    if (!showBacktestResults) return null;
    if (isUnified) return null; // UnifiedStrategy doesn't have backtest_results
    
    const userStrategy = strategy as UserStrategy;
    if (!userStrategy.backtest_results) return null;
    
    try {
      const results = typeof userStrategy.backtest_results === 'string' 
        ? JSON.parse(userStrategy.backtest_results) 
        : userStrategy.backtest_results;
      
      return {
        totalReturn: results.totalReturn || 0,
        winRate: results.winRate || 0,
        maxDrawdown: results.maxDrawdown || 0,
        finalPortfolioValue: results.finalPortfolioValue || 0
      };
    } catch {
      return null;
    }
  };

  const backtestResults = getBacktestResults(strategy);

  // Default formatters
  const defaultFormatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const defaultGetStrategyTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'moving_average_crossover': 'Moving Average Crossover',
      'bollinger_bands': 'Bollinger Bands',
      'mean_reversion': 'Mean Reversion',
      'momentum': 'Momentum',
      'breakout': 'Breakout',
      'custom': 'Custom Strategy'
    };
    return typeMap[type] || type;
  };

  const formatDateFn = formatDate || defaultFormatDate;
  const getStrategyTypeLabelFn = getStrategyTypeLabel || defaultGetStrategyTypeLabel;

  // Size-based styling
  const avatarSize = size === 'compact' ? 48 : 80;
  const cardPadding = size === 'compact' ? 1.5 : 2;

  // Handle card click for selectable mode
  const handleCardClick = () => {
    if (mode === 'selectable' && onSelect) {
      onSelect(strategy);
    }
  };

  // Render card content
  const cardContent = (
    <CardContent 
      sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: size === 'compact' ? 'flex-start' : 'center',
        p: cardPadding,
      }}
    >
      {/* Top Row - Chips on left, Menu on right */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        width: '100%', 
        mb: size === 'compact' ? 1 : 2 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          {isCustom && (
            <Chip label="Custom" color="primary" size="small" />
          )}
          {isPublic && (
            <Tooltip title="Public Strategy">
              <PublicIcon color="primary" fontSize="small" />
            </Tooltip>
          )}
          <Chip
            label={isActive ? 'Active' : 'Inactive'}
            color={isActive ? 'success' : 'default'}
            size="small"
          />
        </Box>
        {mode === 'withActions' && onMenuClick && !isUnified && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onMenuClick(e, strategy as UserStrategy | CustomStrategy);
            }}
          >
            <MoreVertIcon />
          </IconButton>
        )}
      </Box>

      {/* Avatar and Name Row - Horizontal for compact, vertical for normal */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: size === 'compact' ? 'row' : 'column',
        alignItems: size === 'compact' ? 'center' : 'center',
        gap: size === 'compact' ? 2 : 0,
        width: '100%',
        mb: size === 'compact' ? 1 : 2,
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <RobotAvatarDisplay 
            avatar={avatar}
            size={avatarSize}
          />
        </Box>
        <Box sx={{ 
          flex: size === 'compact' ? 1 : 'none',
          minWidth: 0,
          textAlign: size === 'compact' ? 'left' : 'center',
        }}>
          <Typography 
            variant={size === 'compact' ? 'subtitle1' : 'h6'} 
            component="h2" 
            sx={{ 
              mb: size === 'compact' ? 0.5 : 2,
              width: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {name}
          </Typography>
          {size === 'compact' && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {description || 'No description provided'}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Description - Only for normal size */}
      {size === 'normal' && (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          mb={2} 
          textAlign="center" 
          width="100%"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {description || 'No description provided'}
        </Typography>
      )}

      {/* Strategy Type */}
      <Box sx={{ 
        mb: size === 'compact' ? 1 : 2, 
        display: 'flex', 
        justifyContent: size === 'compact' ? 'flex-start' : 'center', 
        width: '100%' 
      }}>
        <Chip
          label={getStrategyTypeLabelFn(strategyType)}
          variant="outlined"
          size="small"
        />
      </Box>

      {/* Backtest Results - Only for normal size */}
      {size === 'normal' && backtestResults && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom textAlign="center">
            Backtest Results
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1} mb={1} justifyContent="center">
            <Chip
              icon={<TrendingUpIcon />}
              label={`${(backtestResults.totalReturn * 100).toFixed(1)}% Return`}
              color={backtestResults.totalReturn > 0 ? 'success' : 'error'}
              size="small"
            />
            <Chip
              icon={<AssessmentIcon />}
              label={`${(backtestResults.winRate * 100).toFixed(1)}% Win Rate`}
              variant="outlined"
              size="small"
            />
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
            Max Drawdown: {(backtestResults.maxDrawdown * 100).toFixed(1)}%
          </Typography>
        </Box>
      )}

      {/* Created Date */}
      {createdAt && (
        <Typography 
          variant="caption" 
          color="text.secondary" 
          sx={{ 
            mt: size === 'compact' ? 0 : 'auto', 
            display: 'block', 
            textAlign: size === 'compact' ? 'left' : 'center' 
          }}
        >
          Created: {formatDateFn(createdAt)}
        </Typography>
      )}
    </CardContent>
  );

  // Render card with appropriate wrapper
  const cardSx = {
    height: size === 'compact' ? 'auto' : '100%',
    display: 'flex',
    flexDirection: 'column',
    ...(borderColor && { border: '2px solid', borderColor }),
    ...(mode === 'selectable' && selected && {
      border: 2,
      borderColor: 'primary.main',
      backgroundColor: 'action.selected',
    }),
    ...(mode === 'selectable' && !selected && {
      border: 1,
      borderColor: 'divider',
    }),
  };

  if (mode === 'selectable') {
    return (
      <Card sx={cardSx}>
        <CardActionArea onClick={handleCardClick}>
          {cardContent}
        </CardActionArea>
      </Card>
    );
  }

  return (
    <Card sx={cardSx}>
      {cardContent}
      {mode === 'withActions' && (
        <CardActions sx={{ justifyContent: 'center' }}>
          {onEdit && (
            <Button
              size="small"
              startIcon={<EditIcon />}
              onClick={() => onEdit(strategy as UserStrategy | CustomStrategy)}
            >
              Edit
            </Button>
          )}
          {onToggleActive && (
            <Button
              size="small"
              startIcon={isActive ? <DeactivateIcon /> : <ActivateIcon />}
              onClick={() => onToggleActive(strategy as UserStrategy | CustomStrategy)}
              color={isActive ? 'warning' : 'success'}
            >
              {isActive ? 'Deactivate' : 'Activate'}
            </Button>
          )}
        </CardActions>
      )}
    </Card>
  );
};

export default BotCard;

