import { registerUser, type RegisterData } from '../../../services/authService';
import type { ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser, loginApi, logoutApi } from '../api/auth.api';
import type { AuthContextType, LoginCredentials } from '../types';
import { AuthContext, AUTH_QUERY_KEY } from './auth-context-definition';
import { boardKeys } from '../../boards/queries/board-queries';

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 1000 * 60 * 15,
  });

  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (userData) => {
      // A new session never inherits another account's boards.
      queryClient.removeQueries({ queryKey: boardKeys.all });
      queryClient.setQueryData(AUTH_QUERY_KEY, userData);
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (userData) => {
      // A new session never inherits another account's boards.
      queryClient.removeQueries({ queryKey: boardKeys.all });
      queryClient.setQueryData(AUTH_QUERY_KEY, userData);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.clear();
    },
  });

  const login = async (credentials: LoginCredentials) => {
    await loginMutation.mutateAsync(credentials);
  };

  const register = async (data: RegisterData) => {
    await registerMutation.mutateAsync(data);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const contextValue: AuthContextType = {
    user: user ?? null,
    isLoading,
    isAuthenticated: Boolean(user) && !isError,
    login,
    register,
    logout,
  };

  return <AuthContext value={contextValue}>{children}</AuthContext>;
}
