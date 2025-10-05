import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { login as loginApi, logout as logoutApi, getCurrentUser } from '../../api';
import { UseUserReturn, LoginCredentials } from './useUser.types';

export const useUser = (): UseUserReturn => {
  const queryClient = useQueryClient();

  // Check if user is authenticated (has token)
  const isAuthenticated = () => {
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('user');
    return !!(token && userData);
  };

  // Get initial user from localStorage if available
  const getInitialUser = () => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  };

  // Query for current user
  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await getCurrentUser();
      return response.data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: isAuthenticated(), // Only fetch if user is authenticated
    initialData: getInitialUser(), // Use localStorage data as initial data
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: LoginCredentials) => {
      const response = await loginApi({ username, password });
      return response.data;
    },
    onSuccess: (data) => {
      // Store token in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Update the user query cache
      queryClient.setQueryData(['user'], data.user);
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await logoutApi();
    },
    onSuccess: () => {
      // Clear localStorage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Clear all query cache
      queryClient.clear();
    },
    onError: (error) => {
      console.error('Logout failed:', error);
      // Still clear local data even if API call fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      queryClient.clear();
    },
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return {
    user: user || getInitialUser(),
    isLoading: isLoading || loginMutation.isPending || logoutMutation.isPending,
    isError: isError || loginMutation.isError || logoutMutation.isError,
    error: error || loginMutation.error || logoutMutation.error,
    login,
    logout,
    refetch,
  };
};
