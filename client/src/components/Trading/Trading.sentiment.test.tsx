import React from 'react';
import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Trading from './Trading';
import { useUser } from '../../hooks';

vi.mock('../../hooks', async () => {
  const actual = await vi.importActual<any>('../../hooks');
  return {
    ...actual,
    useUser: vi.fn(),
  };
});

const createClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
});

const renderWithClient = (ui: React.ReactElement) => {
  const client = createClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

describe('Trading - Sentiment Analysis config', () => {
  it('renders Trading header', () => {
    (useUser as unknown as vi.Mock).mockReturnValue({ user: { id: 1 }, isLoading: false, error: null });
    renderWithClient(<Trading />);
    expect(screen.getByText('Trading')).toBeInTheDocument();
  });
});
