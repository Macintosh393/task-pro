// @vitest-environment jsdom
import { act } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { setupDomTest } from '../../test/setupDomTest';
import { WorkspaceView } from './WorkspaceView';

const dom = setupDomTest();

beforeEach(() => {
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
});

afterEach(() => {
  vi.unstubAllGlobals();
});

it('closes the drawer after a board is selected and keeps selection in the container', () => {
  const onSelectBoard = vi.fn();
  const board = { id: 'a', title: 'Project office', icon: 'project' as const };
  act(() =>
    dom.root.render(
      <WorkspaceView
        user={{ username: 'User', email: 'user@example.test' }}
        boards={[board]}
        activeBoardId="a"
        onSelectBoard={onSelectBoard}
      />,
    ),
  );
  const menu = dom.host.querySelector<HTMLButtonElement>('button[aria-label="Open navigation"]')!;
  act(() => menu.click());
  expect(menu.getAttribute('aria-expanded')).toBe('true');
  const dialog = dom.host.querySelector('dialog')!;
  expect(dialog.hasAttribute('open')).toBe(true);
  act(() => dialog.querySelector<HTMLButtonElement>('button[aria-current="true"]')!.click());
  expect(onSelectBoard).toHaveBeenCalledExactlyOnceWith(board);
  expect(menu.getAttribute('aria-expanded')).toBe('false');
  expect(dialog.hasAttribute('open')).toBe(false);
});

it('keeps the drawer open when edit or delete is used', () => {
  const board = { id: 'a', title: 'Project office', icon: 'project' as const };
  act(() =>
    dom.root.render(
      <WorkspaceView user={{ username: 'User', email: 'user@example.test' }} boards={[board]} />,
    ),
  );
  const menu = dom.host.querySelector<HTMLButtonElement>('button[aria-label="Open navigation"]')!;
  act(() => menu.click());
  const dialog = dom.host.querySelector('dialog')!;
  act(() => dialog.querySelector<HTMLButtonElement>('button[aria-label^="Edit"]')!.click());
  act(() => dialog.querySelector<HTMLButtonElement>('button[aria-label^="Delete"]')!.click());
  expect(menu.getAttribute('aria-expanded')).toBe('true');
});
