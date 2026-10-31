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
});
