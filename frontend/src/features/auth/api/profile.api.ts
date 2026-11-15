import { apiClient } from '../../../lib/api-client';
import type { User } from '../types';

export async function updateProfile(data: Pick<User, 'username' | 'email'>): Promise<User> {
  const response = await apiClient.patch<User>('/users/me', data);
  return response.data;
}
