import { apiClient } from '../../../lib/api-client';
import type { LoginCredentials, User } from '../types';

export const getCurrentUser = async (): Promise<User> => {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
};

export const loginApi = async (credentials: LoginCredentials): Promise<User> => {
  const payload = {
    email: credentials.email,
    password: credentials.password ?? credentials.pass,
    pass: credentials.pass ?? credentials.password,
  };
  const response = await apiClient.post<User>('/auth/login', payload);
  return response.data;
};

export const logoutApi = async (): Promise<void> => {
  await apiClient.post('/auth/logout');
};

export const refreshApi = async (): Promise<void> => {
  await apiClient.post('/auth/refresh');
};
