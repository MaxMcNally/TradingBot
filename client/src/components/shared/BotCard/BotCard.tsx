import React from 'react';
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
  Chip,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  Edit,
  Visibility,
} from '@mui/icons-material';
import { RobotAvatarDisplay } from '../RobotAvatars';
import { UnifiedStrategy } from '../BotSelector';

export interface BotCardProps {
  bot: UnifiedStrategy;
  stats?: {
    totalReturn?: number;
    winRate?: number;
    totalTrades?: number;
    totalSessions?: number;
    activeSessions?: number;
  };
  onClick?: () => void;
  onEdit?: () => void;
}

export const BotCard: React.FC<BotCardProps> = ({
  bot,
  stats,
  onClick,
  onEdit,
}) => {
  const formatPercentage = (value: number | undefined): string => {
    if (value === undefined || isNaN(value)) return '0.00%';
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || isNaN(value)) return '$0.00';
    return `$${value.toFixed(2)}`;
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <RobotAvatarDisplay avatarId={bot.avatar} size={40} />
              <Box>
                <Typography variant="h6" component="div" noWrap>
                  {bot.name}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {bot.type === 'user' ? bot.strategy_type : 'Custom Strategy'}
                </Typography>
              </Box>
            </Box>
            <Box>
              <Chip
                label={bot.is_active ? 'Active' : 'Inactive'}
                color={bot.is_active ? 'success' : 'default'}
                size="small"
              />
            </Box>
          </Box>

          {/* Description */}
          {bot.description && (
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{
                mb: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {bot.description}
            </Typography>
          )}

          {/* Stats */}
          {stats && (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <Stack spacing={1} mt={2}>
                {stats.totalReturn !== undefined && (
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="textSecondary">
                      Total Return
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color={stats.totalReturn >= 0 ? 'success.main' : 'error.main'}
                      display="flex"
                      alignItems="center"
                      gap={0.5}
                    >
                      {stats.totalReturn >= 0 ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                      {formatPercentage(stats.totalReturn)}
                    </Typography>
                  </Box>
                )}
                {stats.winRate !== undefined && (
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="textSecondary">
                      Win Rate
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatPercentage(stats.winRate)}
                    </Typography>
                  </Box>
                )}
                {stats.totalTrades !== undefined && (
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="textSecondary">
                      Total Trades
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stats.totalTrades}
                    </Typography>
                  </Box>
                )}
                {stats.totalSessions !== undefined && (
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="textSecondary">
                      Sessions
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stats.totalSessions}
                      {stats.activeSessions !== undefined && stats.activeSessions > 0 && (
                        <Chip
                          label={`${stats.activeSessions} active`}
                          size="small"
                          color="success"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          )}

          {/* Actions */}
          <Box display="flex" justifyContent="flex-end" gap={1} mt={2} onClick={(e) => e.stopPropagation()}>
            {onEdit && (
              <Tooltip title="Edit Bot">
                <IconButton size="small" onClick={onEdit}>
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="View Details">
              <IconButton size="small" onClick={onClick}>
                <Visibility fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

