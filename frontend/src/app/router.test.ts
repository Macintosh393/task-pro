// @vitest-environment jsdom
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it } from 'vitest';
import { AUTH_QUERY_KEY } from '../features/auth/context/auth-context-definition';
import { router } from './router';

describe('authenticated route guard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    router.update({ context: { queryClient } });
  });

  it('allows immediate navigation after login updates the user cache', async () => {
    queryClient.setQueryData(AUTH_QUERY_KEY, {
      id: 'user-1',
      username: 'test',
      email: 'test@example.com',
      avatarUrl: null,
      theme: 'dark',
    });

    await router.navigate({ to: '/home' });

    expect(router.state.location.pathname).toBe('/home');
  });

  it('rejects stale cached user data after the current-user query fails', async () => {
    const cachedUser = {
      id: 'user-1',
      username: 'test',
      email: 'test@example.com',
      avatarUrl: null,
      theme: 'dark',
    };
    queryClient.setQueryData(AUTH_QUERY_KEY, cachedUser);

    await expect(
      queryClient.fetchQuery({
        queryKey: AUTH_QUERY_KEY,
        queryFn: async () => {
          throw new Error('Session expired');
        },
        retry: false,
      }),
    ).rejects.toThrow('Session expired');

    expect(queryClient.getQueryData(AUTH_QUERY_KEY)).toEqual(cachedUser);
    expect(queryClient.getQueryState(AUTH_QUERY_KEY)?.status).toBe('error');

    await router.navigate({ to: '/' });

    expect(router.state.location.pathname).toBe('/login');

    await router.navigate({ to: '/home' });

    expect(router.state.location.pathname).toBe('/login');
  });
});
