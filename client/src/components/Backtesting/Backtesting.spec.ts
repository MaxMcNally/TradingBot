import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Backtesting from './Backtesting';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  runBacktest: jest.fn(),
  getStrategies: jest.fn(),
  searchSymbols: jest.fn(),
  searchWithYahoo: jest.fn(),
  getPopularSymbols: jest.fn(),
}));

describe('Backtesting Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders backtesting form correctly', () => {
    render(<Backtesting />);
    
    expect(screen.getByText('Strategy Backtesting')).toBeInTheDocument();
    expect(screen.getByText('Backtest Configuration')).toBeInTheDocument();
    expect(screen.getByText('Run Backtest')).toBeInTheDocument();
  });

  it('loads strategies on component mount', async () => {
    const mockStrategies = [
      { name: 'meanReversion', description: 'Mean Reversion Strategy' },
      { name: 'movingAverage', description: 'Moving Average Strategy' }
    ];

    (api.getStrategies as jest.Mock).mockResolvedValue({
      data: { data: { strategies: mockStrategies } }
    });

    render(<Backtesting />);

    await waitFor(() => {
      expect(api.getStrategies).toHaveBeenCalledTimes(1);
    });
  });

  it('searches for symbols when typing in search field', async () => {
    const mockSymbols = [
      { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' }
    ];

    (api.searchWithYahoo as jest.Mock).mockResolvedValue({
      data: { data: { symbols: mockSymbols, source: 'yahoo-finance' } }
    });

    render(<Backtesting />);

    const searchInput = screen.getByPlaceholderText(/search symbols/i);
    fireEvent.change(searchInput, { target: { value: 'AAPL' } });

    await waitFor(() => {
      expect(api.searchWithYahoo).toHaveBeenCalledWith('AAPL');
    });
  });

  it('adds symbol to selected symbols when clicked', async () => {
    const mockSymbols = [
      { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' }
    ];

    (api.searchWithYahoo as jest.Mock).mockResolvedValue({
      data: { data: { symbols: mockSymbols, source: 'yahoo-finance' } }
    });

    render(<Backtesting />);

    const searchInput = screen.getByPlaceholderText(/search symbols/i);
    fireEvent.change(searchInput, { target: { value: 'AAPL' } });

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });

    // Click on the symbol option
    fireEvent.click(screen.getByText('AAPL'));

    // Check if symbol was added to selected symbols
    expect(screen.getByText('AAPL')).toBeInTheDocument();
  });

  it('runs backtest when form is submitted with valid data', async () => {
    const mockBacktestResult = {
      data: {
        results: [
          {
            symbol: 'AAPL',
            totalReturn: 0.15,
            finalPortfolioValue: 11500,
            winRate: 0.6,
            maxDrawdown: 0.05,
            totalTrades: 10
          }
        ]
      }
    };

    (api.getStrategies as jest.Mock).mockResolvedValue({
      data: { data: { strategies: [{ name: 'meanReversion' }] } }
    });

    (api.runBacktest as jest.Mock).mockResolvedValue(mockBacktestResult);

    render(<Backtesting />);

    // Wait for strategies to load
    await waitFor(() => {
      expect(api.getStrategies).toHaveBeenCalled();
    });

    // Add a symbol first
    const searchInput = screen.getByPlaceholderText(/search symbols/i);
    fireEvent.change(searchInput, { target: { value: 'AAPL' } });

    // Mock the search result
    (api.searchWithYahoo as jest.Mock).mockResolvedValue({
      data: { data: { symbols: [{ symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' }] } }
    });

    await waitFor(() => {
      fireEvent.click(screen.getByText('AAPL'));
    });

    // Click run backtest button
    const runButton = screen.getByText('Run Backtest');
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(api.runBacktest).toHaveBeenCalled();
    });
  });

  it('shows error when backtest fails', async () => {
    (api.getStrategies as jest.Mock).mockResolvedValue({
      data: { data: { strategies: [{ name: 'meanReversion' }] } }
    });

    (api.runBacktest as jest.Mock).mockRejectedValue(new Error('Backtest failed'));

    render(<Backtesting />);

    await waitFor(() => {
      expect(api.getStrategies).toHaveBeenCalled();
    });

    // Try to run backtest without symbols
    const runButton = screen.getByText('Run Backtest');
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText('Please select at least one symbol')).toBeInTheDocument();
    });
  });

  it('displays search source indicator', async () => {
    render(<Backtesting />);
    
    // Should show "Live Data" by default
    expect(screen.getByText('Live Data')).toBeInTheDocument();
  });

  it('handles search errors gracefully', async () => {
    (api.searchWithYahoo as jest.Mock).mockRejectedValue(new Error('Search failed'));

    render(<Backtesting />);

    const searchInput = screen.getByPlaceholderText(/search symbols/i);
    fireEvent.change(searchInput, { target: { value: 'INVALID' } });

    await waitFor(() => {
      expect(screen.getByText(/failed to search symbols/i)).toBeInTheDocument();
    });
  });
});
