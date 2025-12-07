import { vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Backtesting from './Backtesting';
import { useStrategies, useBacktest, useUserStrategies, usePublicStrategies } from '../../hooks';

vi.mock('../../hooks', () => ({
  useStrategies: vi.fn(),
  useBacktest: vi.fn(),
  useUserStrategies: vi.fn(),
  usePublicStrategies: vi.fn(),
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('Backtesting Sentiment Strategy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows SentimentAnalysis option in strategy selection', async () => {
    (useStrategies as vi.Mock).mockReturnValue({
      strategies: [
        { name: 'sentimentAnalysis', description: 'News-based', parameters: {}, enabled: true, symbols: [] },
      ],
      isLoading: false,
      isError: false,
    });

    (useBacktest as vi.Mock).mockReturnValue({
      runBacktest: vi.fn(),
      isLoading: false,
      isError: false,
      data: null,
    });

    (useUserStrategies as vi.Mock).mockReturnValue({
      saveFromBacktest: vi.fn(),
      isCreating: false,
    });

    (usePublicStrategies as vi.Mock).mockReturnValue({
      strategies: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithQueryClient(<Backtesting />);

    // Switch to Strategy Selection tab
    fireEvent.click(screen.getByRole('tab', { name: /strategy selection/i }));
    // SentimentAnalysis should be available to select
    expect(await screen.findByRole('radio', { name: /sentimentanalysis/i })).toBeInTheDocument();
  });
});
