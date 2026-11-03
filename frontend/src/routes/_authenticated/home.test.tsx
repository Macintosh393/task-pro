// @vitest-environment jsdom
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from './home';
import { setupDomTest } from '../../test/setupDomTest';

const mockLogout = vi.fn();
const mockNavigate = vi.fn();
const dom = setupDomTest();

vi.mock('../../features/auth', () => ({
  useAuth: () => ({
    user: {
      username: 'test',
      email: 'test@example.com',
    },
    logout: mockLogout,
  }),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

describe('HomePage logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates to login after logout succeeds', async () => {
    await act(async () => {
      dom.root.render(<HomePage />);
    });

    await act(async () => {
      dom.host.querySelector('button')?.click();
    });

    expect(mockLogout).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/login',
      search: { redirect: undefined },
      replace: true,
    });
  });
});
