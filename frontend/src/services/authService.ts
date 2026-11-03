import { apiClient } from '../lib/api-client';
import type { User } from '../features/auth/types';

export type RegisterData = {
  name: string;
  email: string;
  password: string;
};

export type RegisterResponse = User;

export const registerUser = async (data: RegisterData) => {
  const response = await apiClient.post<RegisterResponse>('/auth/register', data);
  return response.data;
};
