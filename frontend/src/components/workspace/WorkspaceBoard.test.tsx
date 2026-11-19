// @vitest-environment jsdom
import { act } from 'react';
import { expect, it, vi } from 'vitest';
import { setupDomTest } from '../../test/setupDomTest';
import { WorkspaceBoard } from './WorkspaceBoard';
import type { WorkspaceColumnsState } from './workspace-types';

const dom = setupDomTest();
const section = () => dom.host.querySelector<HTMLElement>('section.workspace-board')!;
const heading = () => dom.host.querySelector('h1')?.textContent;
const buttons = () => [...dom.host.querySelectorAll('button')];
const button = (name: string) =>
  buttons().find((item) => (item.getAttribute('aria-label') ?? item.textContent) === name)!;
const noColumns: WorkspaceColumnsState = { status: 'ready', columns: [] };
const plain = { title: 'Plain', background: 'none' } as const;

it('prompts to create a board when nothing is selected', () => {
  const onCreateBoard = vi.fn();
  act(() => dom.root.render(<WorkspaceBoard onCreateBoard={onCreateBoard} />));
  const h1 = dom.host.querySelector('h1')!;
  expect(h1.textContent).toBe('Your workspace');
  expect(h1.classList.contains('sr-only')).toBe(true);
  expect(dom.host.querySelector('.workspace-board__heading')).toBeNull();
  expect(dom.host.textContent).toContain('Before starting your project, it is essential');
  expect(section().style.getPropertyValue('--board-bg-desktop')).toBe('');
  act(() => button('to create a board').click());
  expect(onCreateBoard).toHaveBeenCalledOnce();
});

it('shows the active board title and its viewport backgrounds', () => {
  act(() =>
    dom.root.render(
      <WorkspaceBoard
        activeBoard={{
          status: 'ready',
          board: { title: 'Roadmap', background: 'bg-03' },
          columns: noColumns,
        }}
      />,
    ),
  );
  expect(heading()).toBe('Roadmap');
  expect(section().dataset.boardBackground).toBe('bg-03');
  expect(section().style.getPropertyValue('--board-bg-mobile')).toMatch(/bg-03-mobile\.jpg/);
  expect(section().style.getPropertyValue('--board-bg-tablet')).toMatch(/bg-03-tablet\.jpg/);
  expect(section().style.getPropertyValue('--board-bg-desktop')).toMatch(/bg-03-desktop\.jpg/);
});

it('keeps the theme surface for a board without background', () => {
  act(() =>
    dom.root.render(
      <WorkspaceBoard activeBoard={{ status: 'ready', board: plain, columns: noColumns }} />,
    ),
  );
  expect(heading()).toBe('Plain');
  expect(section().getAttribute('style')).toBeNull();
});

it('shows an empty board with only Add another column', () => {
  const onAddColumn = vi.fn();
  act(() =>
    dom.root.render(
      <WorkspaceBoard
        activeBoard={{ status: 'ready', board: plain, columns: noColumns }}
        onAddColumn={onAddColumn}
      />,
    ),
  );
  expect(dom.host.querySelectorAll('.workspace-column')).toHaveLength(0);
  expect(buttons().map((item) => item.textContent)).toEqual(['Add another column']);
  act(() => button('Add another column').click());
  expect(onAddColumn).toHaveBeenCalledOnce();
});

it('renders columns in the given order with Add another column last', () => {
  const onEditColumn = vi.fn();
  const onDeleteColumn = vi.fn();
  const onAddCard = vi.fn();
  const todo = { id: 'c1', title: 'To Do' };
  const done = { id: 'c2', title: 'Done' };
  act(() =>
    dom.root.render(
      <WorkspaceBoard
        activeBoard={{
          status: 'ready',
          board: plain,
          columns: { status: 'ready', columns: [todo, done] },
        }}
        onEditColumn={onEditColumn}
        onDeleteColumn={onDeleteColumn}
        onAddCard={onAddCard}
      />,
    ),
  );
  const titles = [...dom.host.querySelectorAll('.workspace-column h2')].map(
    (title) => title.textContent,
  );
  expect(titles).toEqual(['To Do', 'Done']);
  expect(dom.host.querySelector('h2')!.getAttribute('title')).toBe('To Do');
  expect(buttons().at(-1)!.textContent).toBe('Add another column');

  act(() => button('Edit column Done').click());
  act(() => button('Delete column To Do').click());
  act(() => button('Add another card to Done').click());
  expect(onEditColumn).toHaveBeenCalledWith(done);
  expect(onDeleteColumn).toHaveBeenCalledWith(todo);
  expect(onAddCard).toHaveBeenCalledWith(done);
});

it('announces loading columns and offers a retry when they fail', () => {
  act(() =>
    dom.root.render(
      <WorkspaceBoard
        activeBoard={{ status: 'ready', board: plain, columns: { status: 'loading' } }}
      />,
    ),
  );
  expect(dom.host.querySelector('[role="status"]')?.textContent).toContain('Loading columns');
  expect(heading()).toBe('Plain');

  const onRetry = vi.fn();
  act(() =>
    dom.root.render(
      <WorkspaceBoard
        activeBoard={{ status: 'ready', board: plain, columns: { status: 'error', onRetry } }}
      />,
    ),
  );
  expect(dom.host.querySelector('[role="alert"]')?.textContent).toContain('columns');
  expect(dom.host.textContent).not.toContain('Add another column');
  act(() => button('Try again').click());
  expect(onRetry).toHaveBeenCalledOnce();
});

it('announces loading without a stale title', () => {
  act(() => dom.root.render(<WorkspaceBoard activeBoard={{ status: 'loading' }} />));
  expect(dom.host.querySelector('[role="status"]')?.textContent).toContain('Loading board');
  expect(dom.host.querySelector('h1')).toBeNull();
});

it('offers a way back for an unknown board and a retry for failures', () => {
  const onBack = vi.fn();
  act(() => dom.root.render(<WorkspaceBoard activeBoard={{ status: 'not-found', onBack }} />));
  expect(heading()).toBe('Board not found');
  act(() => dom.host.querySelector('button')!.click());
  expect(onBack).toHaveBeenCalledOnce();

  const onRetry = vi.fn();
  act(() => dom.root.render(<WorkspaceBoard activeBoard={{ status: 'error', onRetry }} />));
  expect(dom.host.querySelector('[role="alert"]')).not.toBeNull();
  act(() => dom.host.querySelector('button')!.click());
  expect(onRetry).toHaveBeenCalledOnce();
});
