// @vitest-environment jsdom
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../hooks/use-auth';
import { AuthProvider } from './auth-context';
import { getCurrentUser, logoutApi } from '../api/auth.api';
import { setupDomTest } from '../../../test/setupDomTest';

vi.mock('../api/auth.api', () => ({
  getCurrentUser: vi.fn(),
  loginApi: vi.fn(),
  logoutApi: vi.fn(),
}));

const dom = setupDomTest();
let queryClient: QueryClient;

function LogoutButton() {
  const { logout } = useAuth();
  return <button onClick={() => void logout()}>Logout</button>;
}

describe('AuthProvider logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'user-1',
      username: 'test',
      email: 'test@example.com',
      avatar_url: null,
      theme: 'dark',
    });
    vi.mocked(logoutApi).mockResolvedValue();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('logs out and clears cached queries without requiring router context', async () => {
    const clearQueryCache = vi.spyOn(queryClient, 'clear');

    await act(async () => {
      dom.root.render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <LogoutButton />
          </AuthProvider>
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      dom.host.querySelector('button')?.click();
    });

    expect(logoutApi).toHaveBeenCalledOnce();
    expect(clearQueryCache).toHaveBeenCalledOnce();
  });
});
