// @vitest-environment jsdom
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '../hooks/use-auth';
import { AuthProvider } from './auth-context';
import { registerUser } from '../../../services/authService';
import { AUTH_QUERY_KEY } from './auth-context-definition';
import { getCurrentUser, logoutApi } from '../api/auth.api';
import { setupDomTest } from '../../../test/setupDomTest';

vi.mock('../api/auth.api', () => ({
  getCurrentUser: vi.fn(),
  loginApi: vi.fn(),
  logoutApi: vi.fn(),
}));

vi.mock('../../../services/authService', () => ({ registerUser: vi.fn() }));

const dom = setupDomTest();
let queryClient: QueryClient;

function LogoutButton() {
  const { logout } = useAuth();
  return <button onClick={() => void logout()}>Logout</button>;
}

function RegisterButton() {
  const { register } = useAuth();
  return (
    <button
      onClick={() =>
        void register({ name: 'New User', email: 'new@example.com', password: 'password123' })
      }
    >
      Register
    </button>
  );
}

describe('AuthProvider logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: 'user-1',
      username: 'test',
      email: 'test@example.com',
      avatarUrl: null,
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

describe('AuthProvider registration', () => {
  it('sets the same current-user cache used by the authenticated route guard', async () => {
    const user = {
      id: 'new-user',
      username: 'New User',
      email: 'new@example.com',
      avatarUrl: null,
      theme: 'dark',
    };
    vi.mocked(getCurrentUser).mockRejectedValue(new Error('Guest'));
    vi.mocked(registerUser).mockResolvedValue(user);
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    await act(async () => {
      dom.root.render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RegisterButton />
          </AuthProvider>
        </QueryClientProvider>,
      );
    });
    await act(async () => {
      dom.host.querySelector('button')?.click();
    });

    expect(registerUser).toHaveBeenCalledWith(
      { name: 'New User', email: 'new@example.com', password: 'password123' },
      expect.objectContaining({ client: queryClient }),
    );
    expect(queryClient.getQueryData(AUTH_QUERY_KEY)).toEqual(user);
    expect(queryClient.getQueryState(AUTH_QUERY_KEY)?.status).toBe('success');
  });
});
