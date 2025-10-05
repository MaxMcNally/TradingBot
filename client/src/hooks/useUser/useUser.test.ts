import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUser } from './useUser';
import * as api from '../../api';

// Mock the API module
jest.mock('../../api', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  getCurrentUser: jest.fn(),
}));

const mockApi = api as jest.Mocked<typeof api>;

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('should return user data when getCurrentUser succeeds', async () => {
    const mockUser = { id: '1', username: 'testuser', email: 'test@example.com' };
    mockApi.getCurrentUser.mockResolvedValueOnce({
      data: mockUser,
    } as any);

    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isError).toBe(false);
  });

  it('should handle login successfully', async () => {
    const mockAuthResponse = {
      token: 'mock-token',
      user: { id: '1', username: 'testuser', email: 'test@example.com' },
    };
    mockApi.login.mockResolvedValueOnce({
      data: mockAuthResponse,
    } as any);
    mockApi.getCurrentUser.mockResolvedValueOnce({
      data: mockAuthResponse.user,
    } as any);

    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper(),
    });

    await result.current.login('testuser', 'password');

    expect(mockApi.login).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password',
    });
    expect(localStorage.getItem('authToken')).toBe('mock-token');
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockAuthResponse.user));
  });

  it('should handle logout successfully', async () => {
    // Set up initial state
    localStorage.setItem('authToken', 'mock-token');
    localStorage.setItem('user', JSON.stringify({ id: '1', username: 'testuser' }));

    mockApi.logout.mockResolvedValueOnce({} as any);

    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper(),
    });

    await result.current.logout();

    expect(mockApi.logout).toHaveBeenCalled();
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('should handle login error', async () => {
    const mockError = new Error('Login failed');
    mockApi.login.mockRejectedValueOnce(mockError);

    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper(),
    });

    await expect(result.current.login('testuser', 'wrongpassword')).rejects.toThrow('Login failed');
    expect(result.current.isError).toBe(true);
  });

  it('should handle getCurrentUser error', async () => {
    mockApi.getCurrentUser.mockRejectedValueOnce(new Error('Unauthorized'));

    const { result } = renderHook(() => useUser(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isError).toBe(true);
  });
});
