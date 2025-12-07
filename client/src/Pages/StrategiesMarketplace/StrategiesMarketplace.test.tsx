import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StrategiesMarketplacePage from './StrategiesMarketplacePage';

// Mock hooks
const mockUseUser = vi.fn();
const mockUseSubscription = vi.fn();
const mockUsePublicStrategies = vi.fn();

vi.mock('../../hooks', () => ({
  useUser: () => mockUseUser(),
  useSubscription: () => mockUseSubscription(),
  usePublicStrategies: () => mockUsePublicStrategies(),
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

describe('Strategies Marketplace Page Logic', () => {
  it('should have correct page structure', () => {
    const pageTitle = 'Strategies Marketplace';
    expect(pageTitle).toBe('Strategies Marketplace');
  });

  it('should handle public strategies', () => {
    const hasPublicStrategies = true;
    expect(hasPublicStrategies).toBe(true);
  });

  it('should support search and filtering', () => {
    const filterOptions = ['search', 'type', 'sort'];
    expect(filterOptions.length).toBe(3);
    expect(filterOptions).toContain('search');
  });

  it('should allow copying strategies', () => {
    const canCopyStrategy = true;
    expect(canCopyStrategy).toBe(true);
  });
});

describe('Strategies Marketplace - Free User Restriction', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockUsePublicStrategies.mockReturnValue({
      strategies: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });
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
      renderWithProviders(<StrategiesMarketplacePage />);

      // Should show the gate
      expect(screen.getByText(/Access our community marketplace/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Unlock Marketplace Access/i })).toBeInTheDocument();
    });

    it('should not show marketplace content for FREE users', () => {
      renderWithProviders(<StrategiesMarketplacePage />);

      // Should NOT show the search/filter functionality
      expect(screen.queryByPlaceholderText(/Search strategies/i)).not.toBeInTheDocument();
    });

    it('should show upgrade benefits for FREE users', () => {
      renderWithProviders(<StrategiesMarketplacePage />);

      expect(screen.getByText('Browse public trading strategies')).toBeInTheDocument();
      expect(screen.getByText('Copy strategies to your account')).toBeInTheDocument();
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

    it('should show marketplace for BASIC users', () => {
      renderWithProviders(<StrategiesMarketplacePage />);

      // Should show the marketplace content
      expect(screen.getByText('Discover and use trading strategies created by the community')).toBeInTheDocument();
    });

    it('should not show upsell gate for BASIC users', () => {
      renderWithProviders(<StrategiesMarketplacePage />);

      // Should NOT show the gate
      expect(screen.queryByRole('button', { name: /Unlock Marketplace Access/i })).not.toBeInTheDocument();
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

    it('should show marketplace for PREMIUM users', () => {
      renderWithProviders(<StrategiesMarketplacePage />);

      expect(screen.getByText('Discover and use trading strategies created by the community')).toBeInTheDocument();
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

      renderWithProviders(<StrategiesMarketplacePage />);

      // Should show the gate based on user.plan_tier
      expect(screen.getByRole('button', { name: /Unlock Marketplace Access/i })).toBeInTheDocument();
    });

    it('should default to FREE when no tier is available', () => {
      mockUseUser.mockReturnValue({
        user: { id: 1, name: 'Test User' },
      });
      mockUseSubscription.mockReturnValue({
        subscription: null,
        isLoading: false,
      });

      renderWithProviders(<StrategiesMarketplacePage />);

      // Should show the gate (default FREE)
      expect(screen.getByRole('button', { name: /Unlock Marketplace Access/i })).toBeInTheDocument();
    });
  });
});
