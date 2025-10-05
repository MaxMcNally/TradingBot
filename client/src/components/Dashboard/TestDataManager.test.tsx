import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TestDataManager from './TestDataManager';
import * as tradingApi from '../../api/tradingApi';

// Mock the trading API
jest.mock('../../api/tradingApi', () => ({
  createTestUser: jest.fn(),
  getTestUser: jest.fn(),
  cleanupTestData: jest.fn(),
  startMockSession: jest.fn(),
  stopMockSession: jest.fn(),
  getActiveMockSessions: jest.fn(),
  stopAllMockSessions: jest.fn(),
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

describe('TestDataManager Component', () => {
  const mockTestUser = {
    id: 999,
    username: 'testuser',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockActiveMockSessions = [
    {
      id: 1,
      userId: 999,
      startTime: '2023-01-01T10:00:00Z',
      endTime: null,
      mode: 'PAPER',
      initialCash: 10000,
      status: 'ACTIVE',
      totalTrades: 5,
      winningTrades: 3,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    (tradingApi.getTestUser as jest.Mock).mockResolvedValue({
      data: { user: null }
    });
    
    (tradingApi.getActiveMockSessions as jest.Mock).mockResolvedValue({
      data: { sessions: [] }
    });
  });

  it('renders test data manager correctly', () => {
    renderWithQueryClient(<TestDataManager />);
    
    expect(screen.getByText('Test Data Manager')).toBeInTheDocument();
    expect(screen.getByText('Manage test users and mock trading sessions for development and testing')).toBeInTheDocument();
  });

  it('shows test user creation section', () => {
    renderWithQueryClient(<TestDataManager />);
    
    expect(screen.getByText('Test User Management')).toBeInTheDocument();
    expect(screen.getByText('Create Test User')).toBeInTheDocument();
    expect(screen.getByText('Generate a test user with historical trading data')).toBeInTheDocument();
  });

  it('shows mock session management section', () => {
    renderWithQueryClient(<TestDataManager />);
    
    expect(screen.getByText('Mock Session Management')).toBeInTheDocument();
    expect(screen.getByText('Configure Mock Session')).toBeInTheDocument();
    expect(screen.getByText('Start a simulated trading session for testing')).toBeInTheDocument();
  });

  it('creates test user successfully', async () => {
    (tradingApi.createTestUser as jest.Mock).mockResolvedValue({
      data: { user: mockTestUser }
    });

    renderWithQueryClient(<TestDataManager />);
    
    const createButton = screen.getByText('Create Test User');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(tradingApi.createTestUser).toHaveBeenCalled();
      expect(screen.getByText('Test user created successfully!')).toBeInTheDocument();
    });
  });

  it('shows error when test user creation fails', async () => {
    (tradingApi.createTestUser as jest.Mock).mockRejectedValue(
      new Error('Failed to create test user')
    );

    renderWithQueryClient(<TestDataManager />);
    
    const createButton = screen.getByText('Create Test User');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to create test user')).toBeInTheDocument();
    });
  });

  it('cleans up test data successfully', async () => {
    (tradingApi.cleanupTestData as jest.Mock).mockResolvedValue({
      data: { success: true }
    });

    renderWithQueryClient(<TestDataManager />);
    
    const cleanupButton = screen.getByText('Cleanup Test Data');
    fireEvent.click(cleanupButton);

    await waitFor(() => {
      expect(tradingApi.cleanupTestData).toHaveBeenCalled();
      expect(screen.getByText('Test data cleaned up successfully!')).toBeInTheDocument();
    });
  });

  it('shows error when cleanup fails', async () => {
    (tradingApi.cleanupTestData as jest.Mock).mockRejectedValue(
      new Error('Failed to cleanup test data')
    );

    renderWithQueryClient(<TestDataManager />);
    
    const cleanupButton = screen.getByText('Cleanup Test Data');
    fireEvent.click(cleanupButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to cleanup test data')).toBeInTheDocument();
    });
  });

  it('handles mock session configuration', () => {
    renderWithQueryClient(<TestDataManager />);
    
    // Configure mock session
    const durationInput = screen.getByLabelText('Session Duration (minutes)');
    fireEvent.change(durationInput, { target: { value: '30' } });
    
    const tradeIntervalInput = screen.getByLabelText('Trade Interval (seconds)');
    fireEvent.change(tradeIntervalInput, { target: { value: '10' } });
    
    expect(durationInput).toHaveValue(30);
    expect(tradeIntervalInput).toHaveValue(10);
  });

  it('starts mock session successfully', async () => {
    (tradingApi.startMockSession as jest.Mock).mockResolvedValue({
      data: { session: mockActiveMockSessions[0] }
    });

    renderWithQueryClient(<TestDataManager />);
    
    // Configure and start mock session
    const durationInput = screen.getByLabelText('Session Duration (minutes)');
    fireEvent.change(durationInput, { target: { value: '30' } });
    
    const startButton = screen.getByText('Start Mock Session');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(tradingApi.startMockSession).toHaveBeenCalledWith({
        duration: 30,
        tradeInterval: 5,
        symbols: ['AAPL', 'GOOGL', 'MSFT'],
        strategy: 'meanReversion',
        initialCash: 10000,
      });
      expect(screen.getByText('Mock session started successfully!')).toBeInTheDocument();
    });
  });

  it('shows error when starting mock session fails', async () => {
    (tradingApi.startMockSession as jest.Mock).mockRejectedValue(
      new Error('Failed to start mock session')
    );

    renderWithQueryClient(<TestDataManager />);
    
    const startButton = screen.getByText('Start Mock Session');
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to start mock session')).toBeInTheDocument();
    });
  });

  it('displays active mock sessions', async () => {
    (tradingApi.getActiveMockSessions as jest.Mock).mockResolvedValue({
      data: { sessions: mockActiveMockSessions }
    });

    renderWithQueryClient(<TestDataManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Active Mock Sessions')).toBeInTheDocument();
      expect(screen.getByText('Session ID: 1')).toBeInTheDocument();
      expect(screen.getByText('Status: ACTIVE')).toBeInTheDocument();
      expect(screen.getByText('Mode: PAPER')).toBeInTheDocument();
    });
  });

  it('stops individual mock session', async () => {
    (tradingApi.getActiveMockSessions as jest.Mock).mockResolvedValue({
      data: { sessions: mockActiveMockSessions }
    });
    (tradingApi.stopMockSession as jest.Mock).mockResolvedValue({
      data: { success: true }
    });

    renderWithQueryClient(<TestDataManager />);
    
    await waitFor(() => {
      const stopButton = screen.getByText('Stop Session');
      fireEvent.click(stopButton);
    });

    await waitFor(() => {
      expect(tradingApi.stopMockSession).toHaveBeenCalledWith(1);
      expect(screen.getByText('Mock session stopped successfully!')).toBeInTheDocument();
    });
  });

  it('stops all mock sessions', async () => {
    (tradingApi.getActiveMockSessions as jest.Mock).mockResolvedValue({
      data: { sessions: mockActiveMockSessions }
    });
    (tradingApi.stopAllMockSessions as jest.Mock).mockResolvedValue({
      data: { success: true }
    });

    renderWithQueryClient(<TestDataManager />);
    
    await waitFor(() => {
      const stopAllButton = screen.getByText('Stop All Sessions');
      fireEvent.click(stopAllButton);
    });

    await waitFor(() => {
      expect(tradingApi.stopAllMockSessions).toHaveBeenCalled();
      expect(screen.getByText('All mock sessions stopped successfully!')).toBeInTheDocument();
    });
  });

  it('shows error when stopping mock session fails', async () => {
    (tradingApi.getActiveMockSessions as jest.Mock).mockResolvedValue({
      data: { sessions: mockActiveMockSessions }
    });
    (tradingApi.stopMockSession as jest.Mock).mockRejectedValue(
      new Error('Failed to stop mock session')
    );

    renderWithQueryClient(<TestDataManager />);
    
    await waitFor(() => {
      const stopButton = screen.getByText('Stop Session');
      fireEvent.click(stopButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to stop mock session')).toBeInTheDocument();
    });
  });

  it('handles validation for mock session configuration', () => {
    renderWithQueryClient(<TestDataManager />);
    
    // Try to start with invalid duration
    const durationInput = screen.getByLabelText('Session Duration (minutes)');
    fireEvent.change(durationInput, { target: { value: '0' } });
    
    const startButton = screen.getByText('Start Mock Session');
    fireEvent.click(startButton);

    expect(screen.getByText('Duration must be at least 1 minute')).toBeInTheDocument();
  });

  it('shows loading states during operations', async () => {
    (tradingApi.createTestUser as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ data: { user: mockTestUser } }), 100))
    );

    renderWithQueryClient(<TestDataManager />);
    
    const createButton = screen.getByText('Create Test User');
    fireEvent.click(createButton);

    // Should show loading state
    expect(screen.getByText('Creating test user...')).toBeInTheDocument();
  });

  it('displays test user information when available', async () => {
    (tradingApi.getTestUser as jest.Mock).mockResolvedValue({
      data: { user: mockTestUser }
    });

    renderWithQueryClient(<TestDataManager />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User Information')).toBeInTheDocument();
      expect(screen.getByText('Username: testuser')).toBeInTheDocument();
      expect(screen.getByText('Email: test@example.com')).toBeInTheDocument();
    });
  });

  it('handles empty active sessions list', async () => {
    (tradingApi.getActiveMockSessions as jest.Mock).mockResolvedValue({
      data: { sessions: [] }
    });

    renderWithQueryClient(<TestDataManager />);
    
    await waitFor(() => {
      expect(screen.getByText('No active mock sessions')).toBeInTheDocument();
    });
  });
});
