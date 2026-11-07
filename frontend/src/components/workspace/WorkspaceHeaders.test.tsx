// @vitest-environment jsdom
import { act } from 'react';
import { expect, it, vi } from 'vitest';
import { setupDomTest } from '../../test/setupDomTest';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceBoard } from './WorkspaceBoard';

const dom = setupDomTest();
const user = { username: 'Current user', email: 'user@example.test', avatarUrl: 'avatar.png' };

it('renders current profile, reuses navigation action and falls back from a broken avatar', () => {
  const navigate = vi.fn();
  const edit = vi.fn();
  act(() =>
    dom.root.render(
      <WorkspaceHeader
        user={user}
        onEditProfile={edit}
        menuButtonProps={{ onClick: navigate, 'aria-label': 'Open navigation' }}
      />,
    ),
  );
  const profile = dom.host.querySelector<HTMLButtonElement>(
    '[aria-label="Edit profile: Current user"]',
  )!;
  act(() => profile.click());
  expect(edit).toHaveBeenCalledOnce();
  act(() => dom.host.querySelector<HTMLButtonElement>('[aria-label="Open navigation"]')!.click());
  expect(navigate).toHaveBeenCalledOnce();
  expect(dom.host.querySelector('img')?.getAttribute('src')).toBe('avatar.png');
  act(() => dom.host.querySelector('img')!.dispatchEvent(new Event('error')));
  expect(dom.host.querySelector('img')).toBeNull();
  expect(profile.querySelector('svg')).not.toBeNull();
});

it('keeps empty board data and forwards the selected board and filters action', () => {
  act(() => dom.root.render(<WorkspaceBoard />));
  expect(dom.host.querySelector('h1')?.textContent).toBe('Your workspace');
  expect(dom.host.querySelector('button')?.disabled).toBe(true);
  const filters = vi.fn();
  act(() =>
    dom.root.render(
      <WorkspaceBoard activeBoard={{ id: '1', title: 'Selected board' }} onOpenFilters={filters} />,
    ),
  );
  expect(dom.host.querySelector('h1')?.textContent).toBe('Selected board');
  act(() => dom.host.querySelector('button')!.click());
  expect(filters).toHaveBeenCalledOnce();
  act(() => dom.root.render(<WorkspaceBoard activeBoard={null} onOpenFilters={filters} />));
  expect(dom.host.querySelector('h1')?.textContent).toBe('Your workspace');
  expect(dom.host.querySelector('button')?.disabled).toBe(true);
});
