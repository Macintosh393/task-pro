// @vitest-environment jsdom
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from './home';
import type { WorkspaceViewProps } from '../../components/workspace/workspace-types';
import { setupDomTest } from '../../test/setupDomTest';

const mockLogout = vi.fn();
const mockNavigate = vi.fn();
const mockView = vi.fn<(props: WorkspaceViewProps) => null>(() => null);
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

vi.mock('../../components/workspace/WorkspaceView', () => ({
  WorkspaceView: (props: WorkspaceViewProps) => mockView(props),
}));

describe('HomePage logout callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('navigates to the welcome page after logout succeeds', async () => {
    await act(async () => {
      dom.root.render(<HomePage />);
    });

    await act(async () => {
      mockView.mock.calls.at(-1)![0].onLogout();
    });

    expect(mockLogout).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/',
      replace: true,
    });
  });
});
