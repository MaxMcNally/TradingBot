import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import BotCard from './BotCard';
import { UserStrategy } from '../../../api';
import { CustomStrategy } from '../../../api/customStrategiesApi';
import { UnifiedStrategy } from '../BotSelector';

// Mock RobotAvatarDisplay
vi.mock('../RobotAvatars', () => ({
  RobotAvatarDisplay: ({ avatar, size }: { avatar?: number | null; size: number }) => (
    <div data-testid="robot-avatar" data-avatar={avatar} data-size={size}>
      Avatar {avatar || 'default'}
    </div>
  ),
}));

describe('BotCard Component', () => {
  const mockUserStrategy: UserStrategy = {
    id: 1,
    user_id: 1,
    name: 'Test Strategy',
    description: 'Test description',
    strategy_type: 'moving_average_crossover',
    config: { fastWindow: 10, slowWindow: 30 },
    is_active: true,
    is_public: false,
    avatar: 1,
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
  };

  const mockCustomStrategy: CustomStrategy = {
    id: 2,
    user_id: 1,
    name: 'Custom Strategy',
    description: 'Custom description',
    buy_conditions: { type: 'AND', children: [] },
    sell_conditions: { type: 'AND', children: [] },
    is_active: true,
    is_public: false,
    avatar: 2,
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z',
  };

  const mockUnifiedStrategy: UnifiedStrategy = {
    id: 3,
    name: 'Unified Strategy',
    description: 'Unified description',
    type: 'user',
    strategy_type: 'bollinger_bands',
    is_active: true,
    is_public: true,
    avatar: 3,
    config: {},
    original: mockUserStrategy,
  };

  const defaultFormatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  describe('Rendering', () => {
    it('should render UserStrategy correctly in normal size', () => {
      render(<BotCard strategy={mockUserStrategy} size="normal" mode="display" />);

      expect(screen.getByText('Test Strategy')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Moving Average Crossover')).toBeInTheDocument();
    });

    it('should render CustomStrategy correctly', () => {
      render(
        <BotCard
          strategy={mockCustomStrategy}
          size="normal"
          mode="display"
          isCustom={true}
        />
      );

      expect(screen.getByText('Custom Strategy')).toBeInTheDocument();
      expect(screen.getByText('Custom')).toBeInTheDocument();
      expect(screen.getByText('Custom Strategy')).toBeInTheDocument();
    });

    it('should render UnifiedStrategy correctly', () => {
      render(<BotCard strategy={mockUnifiedStrategy} size="normal" mode="display" />);

      expect(screen.getByText('Unified Strategy')).toBeInTheDocument();
      expect(screen.getByText('Unified description')).toBeInTheDocument();
      expect(screen.getByText('Bollinger Bands')).toBeInTheDocument();
    });

    it('should render in compact size', () => {
      render(<BotCard strategy={mockUserStrategy} size="compact" mode="display" />);

      expect(screen.getByText('Test Strategy')).toBeInTheDocument();
      const avatar = screen.getByTestId('robot-avatar');
      expect(avatar).toHaveAttribute('data-size', '48');
    });

    it('should show "No description provided" when description is missing', () => {
      const strategyWithoutDescription = { ...mockUserStrategy, description: undefined };
      render(<BotCard strategy={strategyWithoutDescription} size="normal" mode="display" />);

      expect(screen.getByText('No description provided')).toBeInTheDocument();
    });

    it('should display inactive status correctly', () => {
      const inactiveStrategy = { ...mockUserStrategy, is_active: false };
      render(<BotCard strategy={inactiveStrategy} size="normal" mode="display" />);

      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('should display public icon when strategy is public', () => {
      const publicStrategy = { ...mockUserStrategy, is_public: true };
      render(<BotCard strategy={publicStrategy} size="normal" mode="display" />);

      // Check for PublicIcon (it should be in the document)
      const publicIcon = screen.getByTitle('Public Strategy');
      expect(publicIcon).toBeInTheDocument();
    });

    it('should display created date', () => {
      render(<BotCard strategy={mockUserStrategy} size="normal" mode="display" />);

      expect(screen.getByText(/Created:/)).toBeInTheDocument();
    });
  });

  describe('Backtest Results', () => {
    it('should display backtest results when available', () => {
      const strategyWithBacktest = {
        ...mockUserStrategy,
        backtest_results: JSON.stringify({
          totalReturn: 0.15,
          winRate: 0.65,
          maxDrawdown: 0.05,
          finalPortfolioValue: 11500,
        }),
      };

      render(
        <BotCard
          strategy={strategyWithBacktest}
          size="normal"
          mode="display"
          showBacktestResults={true}
        />
      );

      expect(screen.getByText('Backtest Results')).toBeInTheDocument();
      expect(screen.getByText('15.0% Return')).toBeInTheDocument();
      expect(screen.getByText('65.0% Win Rate')).toBeInTheDocument();
      expect(screen.getByText(/Max Drawdown: 5.0%/)).toBeInTheDocument();
    });

    it('should not display backtest results when showBacktestResults is false', () => {
      const strategyWithBacktest = {
        ...mockUserStrategy,
        backtest_results: JSON.stringify({
          totalReturn: 0.15,
          winRate: 0.65,
          maxDrawdown: 0.05,
        }),
      };

      render(
        <BotCard
          strategy={strategyWithBacktest}
          size="normal"
          mode="display"
          showBacktestResults={false}
        />
      );

      expect(screen.queryByText('Backtest Results')).not.toBeInTheDocument();
    });

    it('should handle invalid backtest results gracefully', () => {
      const strategyWithInvalidBacktest = {
        ...mockUserStrategy,
        backtest_results: 'invalid json',
      };

      render(
        <BotCard
          strategy={strategyWithInvalidBacktest}
          size="normal"
          mode="display"
          showBacktestResults={true}
        />
      );

      expect(screen.queryByText('Backtest Results')).not.toBeInTheDocument();
    });
  });

  describe('Selectable Mode', () => {
    it('should be clickable in selectable mode', () => {
      const onSelect = vi.fn();
      render(
        <BotCard
          strategy={mockUserStrategy}
          size="normal"
          mode="selectable"
          onSelect={onSelect}
        />
      );

      // Find the card by its content
      const cardContent = screen.getByText('Test Strategy');
      const card = cardContent.closest('div[class*="MuiCard"]') || cardContent.closest('div');
      expect(card).toBeInTheDocument();

      // Click on the card
      if (card) {
        fireEvent.click(card);
        expect(onSelect).toHaveBeenCalledWith(mockUserStrategy);
      }
    });

    it('should show selected state when selected is true', () => {
      const { container } = render(
        <BotCard
          strategy={mockUserStrategy}
          size="normal"
          mode="selectable"
          selected={true}
          onSelect={vi.fn()}
        />
      );

      const card = container.querySelector('[class*="MuiCard"]');
      expect(card).toBeInTheDocument();
      // Selected cards should have a border
      expect(card).toHaveStyle({ borderWidth: expect.anything() });
    });

    it('should not show selected state when selected is false', () => {
      const { container } = render(
        <BotCard
          strategy={mockUserStrategy}
          size="normal"
          mode="selectable"
          selected={false}
          onSelect={vi.fn()}
        />
      );

      const card = container.querySelector('[class*="MuiCard"]');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('Test Strategy')).toBeInTheDocument();
    });
  });

  describe('With Actions Mode', () => {
    it('should display edit and toggle buttons', () => {
      const onEdit = vi.fn();
      const onToggleActive = vi.fn();

      render(
        <BotCard
          strategy={mockUserStrategy}
          size="normal"
          mode="withActions"
          onEdit={onEdit}
          onToggleActive={onToggleActive}
        />
      );

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Deactivate')).toBeInTheDocument();
    });

    it('should call onEdit when edit button is clicked', () => {
      const onEdit = vi.fn();

      render(
        <BotCard
          strategy={mockUserStrategy}
          size="normal"
          mode="withActions"
          onEdit={onEdit}
        />
      );

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);
      expect(onEdit).toHaveBeenCalledWith(mockUserStrategy);
    });

    it('should call onToggleActive when toggle button is clicked', () => {
      const onToggleActive = vi.fn();

      render(
        <BotCard
          strategy={mockUserStrategy}
          size="normal"
          mode="withActions"
          onToggleActive={onToggleActive}
        />
      );

      const toggleButton = screen.getByText('Deactivate');
      fireEvent.click(toggleButton);
      expect(onToggleActive).toHaveBeenCalledWith(mockUserStrategy);
    });

    it('should show "Activate" for inactive strategies', () => {
      const inactiveStrategy = { ...mockUserStrategy, is_active: false };

      render(
        <BotCard
          strategy={inactiveStrategy}
          size="normal"
          mode="withActions"
          onToggleActive={vi.fn()}
        />
      );

      expect(screen.getByText('Activate')).toBeInTheDocument();
    });

    it('should display menu button when onMenuClick is provided', () => {
      const onMenuClick = vi.fn();

      render(
        <BotCard
          strategy={mockUserStrategy}
          size="normal"
          mode="withActions"
          onMenuClick={onMenuClick}
        />
      );

      const menuButton = screen.getByRole('button', { name: '' }); // MoreVert icon button
      expect(menuButton).toBeInTheDocument();

      fireEvent.click(menuButton);
      expect(onMenuClick).toHaveBeenCalled();
    });
  });

  describe('Custom Formatting', () => {
    it('should use custom formatDate function when provided', () => {
      const customFormatDate = vi.fn((date: string) => 'Custom Date Format');

      render(
        <BotCard
          strategy={mockUserStrategy}
          size="normal"
          mode="display"
          formatDate={customFormatDate}
        />
      );

      expect(customFormatDate).toHaveBeenCalledWith(mockUserStrategy.created_at);
      expect(screen.getByText(/Custom Date Format/)).toBeInTheDocument();
    });

    it('should use custom getStrategyTypeLabel function when provided', () => {
      const customGetStrategyTypeLabel = vi.fn((type: string) => 'Custom Type Label');

      render(
        <BotCard
          strategy={mockUserStrategy}
          size="normal"
          mode="display"
          getStrategyTypeLabel={customGetStrategyTypeLabel}
        />
      );

      expect(customGetStrategyTypeLabel).toHaveBeenCalledWith('moving_average_crossover');
      expect(screen.getByText('Custom Type Label')).toBeInTheDocument();
    });
  });

  describe('Border Color', () => {
    it('should apply custom border color when provided', () => {
      const { container } = render(
        <BotCard
          strategy={mockUserStrategy}
          size="normal"
          mode="display"
          borderColor="primary.main"
        />
      );

      const card = container.querySelector('[class*="MuiCard"]');
      expect(card).toBeInTheDocument();
      expect(screen.getByText('Test Strategy')).toBeInTheDocument();
    });
  });

  describe('Avatar Display', () => {
    it('should display avatar with correct size for normal mode', () => {
      render(<BotCard strategy={mockUserStrategy} size="normal" mode="display" />);

      const avatar = screen.getByTestId('robot-avatar');
      expect(avatar).toHaveAttribute('data-size', '80');
      expect(avatar).toHaveAttribute('data-avatar', '1');
    });

    it('should display avatar with correct size for compact mode', () => {
      render(<BotCard strategy={mockUserStrategy} size="compact" mode="display" />);

      const avatar = screen.getByTestId('robot-avatar');
      expect(avatar).toHaveAttribute('data-size', '48');
    });

    it('should handle null avatar', () => {
      const strategyWithoutAvatar = { ...mockUserStrategy, avatar: null };
      render(<BotCard strategy={strategyWithoutAvatar} size="normal" mode="display" />);

      const avatar = screen.getByTestId('robot-avatar');
      expect(avatar).toHaveAttribute('data-avatar', 'null');
    });
  });

  describe('Edge Cases', () => {
    it('should handle strategy without created_at', () => {
      const strategyWithoutDate = { ...mockUserStrategy };
      delete (strategyWithoutDate as any).created_at;

      render(<BotCard strategy={strategyWithoutDate} size="normal" mode="display" />);

      expect(screen.getByText('Test Strategy')).toBeInTheDocument();
    });

    it('should handle UnifiedStrategy with original strategy', () => {
      render(<BotCard strategy={mockUnifiedStrategy} size="normal" mode="display" />);

      expect(screen.getByText('Unified Strategy')).toBeInTheDocument();
      // Should get created_at from original
      expect(screen.getByText(/Created:/)).toBeInTheDocument();
    });

    it('should handle compact mode layout correctly', () => {
      render(<BotCard strategy={mockUserStrategy} size="compact" mode="display" />);

      expect(screen.getByText('Test Strategy')).toBeInTheDocument();
      // In compact mode, description should be shown as caption
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });
  });
});

