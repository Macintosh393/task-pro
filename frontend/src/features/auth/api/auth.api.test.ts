import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getCurrentUser, loginApi, logoutApi, refreshApi } from './auth.api';
import { apiClient } from '../../../lib/api-client';

vi.mock('../../../lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('auth.api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getCurrentUser calls /users/me and returns user data', async () => {
    const mockUser = {
      id: 'u-1',
      username: 'testuser',
      email: 'test@example.com',
      avatarUrl: null,
      theme: 'dark',
    };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockUser });

    const result = await getCurrentUser();
    expect(apiClient.get).toHaveBeenCalledWith('/users/me');
    expect(result).toEqual(mockUser);
  });

  it('loginApi sends credentials to /auth/login', async () => {
    const mockUser = {
      id: 'u-1',
      username: 'testuser',
      email: 'test@example.com',
      avatarUrl: null,
      theme: 'dark',
    };
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: mockUser });

    const result = await loginApi({ email: 'test@example.com', password: 'secretpassword' });
    expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'secretpassword',
    });
    expect(result).toEqual(mockUser);
  });

  it('logoutApi calls /auth/logout', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({});
    await logoutApi();
    expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
  });

  it('refreshApi calls /auth/refresh', async () => {
    vi.mocked(apiClient.post).mockResolvedValueOnce({});
    await refreshApi();
    expect(apiClient.post).toHaveBeenCalledWith('/auth/refresh');
  });
});
