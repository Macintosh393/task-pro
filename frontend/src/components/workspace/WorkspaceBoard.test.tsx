// @vitest-environment jsdom
import { act } from 'react';
import { expect, it, vi } from 'vitest';
import { setupDomTest } from '../../test/setupDomTest';
import { WorkspaceBoard } from './WorkspaceBoard';

const dom = setupDomTest();
const section = () => dom.host.querySelector<HTMLElement>('section.workspace-board')!;
const heading = () => dom.host.querySelector('h1')?.textContent;

it('prompts to select or create a board when nothing is selected', () => {
  act(() => dom.root.render(<WorkspaceBoard />));
  expect(heading()).toBe('Your workspace');
  expect(dom.host.textContent).toContain('create a new one');
  expect(section().style.getPropertyValue('--board-bg-desktop')).toBe('');
});

it('shows the active board title and its viewport backgrounds', () => {
  act(() =>
    dom.root.render(
      <WorkspaceBoard
        activeBoard={{ status: 'ready', board: { title: 'Roadmap', background: 'bg-03' } }}
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
      <WorkspaceBoard
        activeBoard={{ status: 'ready', board: { title: 'Plain', background: 'none' } }}
      />,
    ),
  );
  expect(heading()).toBe('Plain');
  expect(section().getAttribute('style')).toBeNull();
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
