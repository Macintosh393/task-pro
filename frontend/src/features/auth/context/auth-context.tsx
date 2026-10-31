import type { ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { getCurrentUser, loginApi, logoutApi } from '../api/auth.api';
import type { AuthContextType, LoginCredentials } from '../types';
import { AuthContext, AUTH_QUERY_KEY } from './auth-context-definition';

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

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

  const logout = async () => {
    await logoutMutation.mutateAsync();
    await navigate({ to: '/login', search: { redirect: undefined }, replace: true });
  };

  const contextValue: AuthContextType = {
    user: user ?? null,
    isLoading,
    isAuthenticated: Boolean(user) && !isError,
    login,
    logout,
  };

  return <AuthContext value={contextValue}>{children}</AuthContext>;
}
