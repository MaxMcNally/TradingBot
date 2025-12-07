import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LeaderboardPage from './LeaderboardPage';

// Mock hooks
const mockUseUser = vi.fn();
const mockUseSubscription = vi.fn();

vi.mock('../../hooks', () => ({
  useUser: () => mockUseUser(),
  useSubscription: () => mockUseSubscription(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const theme = createTheme();
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {component}
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('LeaderboardPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Free user - upsell gate', () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        user: { id: 1, name: 'Test User', plan_tier: 'FREE' },
      });
      mockUseSubscription.mockReturnValue({
        subscription: { planTier: 'FREE' },
        isLoading: false,
      });
    });

    it('should show upsell gate for FREE users', () => {
      renderWithProviders(<LeaderboardPage />);

      // Should show the gate
      expect(screen.getByText(/See how your trading strategies rank/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Unlock Leaderboard Access/i })).toBeInTheDocument();
    });

    it('should not show leaderboard table for FREE users', () => {
      renderWithProviders(<LeaderboardPage />);

      // Should NOT show the leaderboard table
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should show upgrade benefits for FREE users', () => {
      renderWithProviders(<LeaderboardPage />);

      expect(screen.getByText('View global strategy rankings')).toBeInTheDocument();
      expect(screen.getByText('Compare your performance with top traders')).toBeInTheDocument();
    });
  });

  describe('Paid user - full access', () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        user: { id: 1, name: 'Test User', plan_tier: 'BASIC' },
      });
      mockUseSubscription.mockReturnValue({
        subscription: { planTier: 'BASIC' },
        isLoading: false,
      });
    });

    it('should show leaderboard for BASIC users', async () => {
      renderWithProviders(<LeaderboardPage />);

      // Wait for mock data to load
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      // Should show the leaderboard
      expect(screen.getByText('Top performing strategies ranked by total return')).toBeInTheDocument();
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should show podium for top 3 traders', async () => {
      renderWithProviders(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      // Should show rank numbers 1, 2, 3 in the podium
      expect(screen.getAllByText('1')[0]).toBeInTheDocument();
      expect(screen.getAllByText('2')[0]).toBeInTheDocument();
      expect(screen.getAllByText('3')[0]).toBeInTheDocument();
    });

    it('should show member tier badge', async () => {
      renderWithProviders(<LeaderboardPage />);

      expect(screen.getByText('BASIC Member')).toBeInTheDocument();
    });
  });

  describe('Premium user - full access', () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        user: { id: 1, name: 'Premium User', plan_tier: 'PREMIUM' },
      });
      mockUseSubscription.mockReturnValue({
        subscription: { planTier: 'PREMIUM' },
        isLoading: false,
      });
    });

    it('should show leaderboard for PREMIUM users', async () => {
      renderWithProviders(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should show PREMIUM member badge', () => {
      renderWithProviders(<LeaderboardPage />);

      expect(screen.getByText('PREMIUM Member')).toBeInTheDocument();
    });
  });

  describe('Enterprise user - full access', () => {
    beforeEach(() => {
      mockUseUser.mockReturnValue({
        user: { id: 1, name: 'Enterprise User', plan_tier: 'ENTERPRISE' },
      });
      mockUseSubscription.mockReturnValue({
        subscription: { planTier: 'ENTERPRISE' },
        isLoading: false,
      });
    });

    it('should show leaderboard for ENTERPRISE users', async () => {
      renderWithProviders(<LeaderboardPage />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      }, { timeout: 2000 });

      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });

  describe('Fallback behavior', () => {
    it('should use user plan_tier as fallback when subscription is not loaded', () => {
      mockUseUser.mockReturnValue({
        user: { id: 1, name: 'Test User', plan_tier: 'FREE' },
      });
      mockUseSubscription.mockReturnValue({
        subscription: null,
        isLoading: true,
      });

      renderWithProviders(<LeaderboardPage />);

      // Should show the gate based on user.plan_tier
      expect(screen.getByRole('button', { name: /Unlock Leaderboard Access/i })).toBeInTheDocument();
    });

    it('should default to FREE when no tier is available', () => {
      mockUseUser.mockReturnValue({
        user: { id: 1, name: 'Test User' },
      });
      mockUseSubscription.mockReturnValue({
        subscription: null,
        isLoading: false,
      });

      renderWithProviders(<LeaderboardPage />);

      // Should show the gate (default FREE)
      expect(screen.getByRole('button', { name: /Unlock Leaderboard Access/i })).toBeInTheDocument();
    });
  });
});
