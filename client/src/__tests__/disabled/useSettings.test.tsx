import { vi } from 'vitest';
import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSettings } from './useSettings';
import * as api from '../../api';

// Mock the API module
vi.mock('../../api', () => ({
  getSettings: vi.fn(),
  saveSetting: vi.fn(),
}));

const mockApi = api as vi.Mocked<typeof api>;

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => 
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return settings data when getSettings succeeds', async () => {
    const mockSettings = [
      { id: '1', user_id: '1', setting_key: 'theme', setting_value: 'dark', created_at: '2023-01-01', updated_at: '2023-01-01' },
      { id: '2', user_id: '1', setting_key: 'notifications', setting_value: 'true', created_at: '2023-01-01', updated_at: '2023-01-01' },
    ];
    mockApi.getSettings.mockResolvedValueOnce(mockSettings as any);

    const { result } = renderHook(() => useSettings('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings).toEqual(mockSettings);
    expect(result.current.isError).toBe(false);
  });

  it('should handle saveSetting successfully', async () => {
    const mockSettings = [];
    mockApi.getSettings.mockResolvedValueOnce(mockSettings as any);
    mockApi.saveSetting.mockResolvedValueOnce({} as any);

    const { result } = renderHook(() => useSettings('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await result.current.saveSetting({
      setting_key: 'theme',
      setting_value: 'dark',
    });

    expect(mockApi.saveSetting).toHaveBeenCalledWith({
      user_id: '1',
      setting_key: 'theme',
      setting_value: 'dark',
    });
  });

  it('should handle getSettings error', async () => {
    mockApi.getSettings.mockRejectedValueOnce(new Error('Failed to fetch settings'));

    const { result } = renderHook(() => useSettings('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.settings).toEqual([]);
    expect(result.current.isError).toBe(true);
  });

  it('should handle saveSetting error', async () => {
    const mockSettings = [];
    mockApi.getSettings.mockResolvedValueOnce(mockSettings as any);
    mockApi.saveSetting.mockRejectedValueOnce(new Error('Save failed'));

    const { result } = renderHook(() => useSettings('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await expect(result.current.saveSetting({
      setting_key: 'theme',
      setting_value: 'dark',
    })).rejects.toThrow('Save failed');

    expect(result.current.isError).toBe(true);
  });

  it('should not fetch settings when userId is empty', () => {
    const { result } = renderHook(() => useSettings(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.settings).toEqual([]);
    expect(mockApi.getSettings).not.toHaveBeenCalled();
  });
});
