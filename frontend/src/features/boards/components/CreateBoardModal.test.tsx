// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { setupDomTest } from '../../../test/setupDomTest';
import * as api from '../api/boards.api';
import type { Board } from '../types';
import { CreateBoardModal } from './CreateBoardModal';

vi.mock('../api/boards.api', () => ({
  getBoards: vi.fn(),
  getBoard: vi.fn(),
  createBoard: vi.fn(),
}));

const dom = setupDomTest();

const created: Board = {
  id: '3f0d6a52-8a0e-4c4f-9f3b-2d6f4a1e9c11',
  title: 'Roadmap',
  icon: 'star',
  background: 'bg-03',
  createdAt: '2026-11-13T10:00:00.000Z',
  updatedAt: '2026-11-13T10:00:00.000Z',
};

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
  };
  vi.mocked(api.getBoards).mockResolvedValue([]);
});

afterEach(() => vi.clearAllMocks());

function renderModal(props: Partial<Parameters<typeof CreateBoardModal>[0]> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onCreated = vi.fn();
  const onClose = vi.fn();
  act(() =>
    dom.root.render(
      <QueryClientProvider client={queryClient}>
        <CreateBoardModal open userId="u1" onClose={onClose} onCreated={onCreated} {...props} />
      </QueryClientProvider>,
    ),
  );
  return { onCreated, onClose };
}

function typeTitle(value: string) {
  const input = dom.host.querySelector<HTMLInputElement>('input[name="title"]')!;
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  act(() => {
    setValue.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function submit() {
  await act(async () => {
    dom.host.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
  });
}

const checked = (name: string) =>
  dom.host.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value;

it('opens with an empty title, the first icon and no background', () => {
  renderModal();
  expect(dom.host.querySelector('dialog')?.hasAttribute('open')).toBe(true);
  expect(dom.host.textContent).toContain('New board');
  expect(dom.host.querySelector<HTMLInputElement>('input[name="title"]')!.value).toBe('');
  expect(dom.host.querySelectorAll('input[name="board-icon"]')).toHaveLength(8);
  expect(dom.host.querySelectorAll('input[name="board-background"]')).toHaveLength(16);
  expect(checked('board-icon')).toBe('project');
  expect(checked('board-background')).toBe('none');
});

it('requires a title before sending a request', async () => {
  const { onCreated } = renderModal();
  typeTitle('   ');
  await submit();
  expect(dom.host.textContent).toContain('Title is required');
  expect(api.createBoard).not.toHaveBeenCalled();
  expect(onCreated).not.toHaveBeenCalled();
});

it('sends the trimmed title with the chosen icon and background', async () => {
  vi.mocked(api.createBoard).mockResolvedValue(created);
  const { onCreated } = renderModal();
  typeTitle('  Roadmap  ');
  act(() => dom.host.querySelector<HTMLInputElement>('input[value="star"]')!.click());
  act(() => dom.host.querySelector<HTMLInputElement>('input[value="bg-03"]')!.click());
  await submit();
  expect(vi.mocked(api.createBoard).mock.calls[0]?.[0]).toEqual({
    title: 'Roadmap',
    icon: 'star',
    background: 'bg-03',
  });
  expect(onCreated).toHaveBeenCalledExactlyOnceWith(created);
});

it('shows the server error and keeps the entered values', async () => {
  vi.mocked(api.createBoard).mockRejectedValue({
    response: { status: 400, data: { message: ['title must be shorter'] } },
  });
  const { onCreated } = renderModal();
  typeTitle('Roadmap');
  await submit();
  expect(dom.host.querySelector('[role="alert"]')?.textContent).toBe('title must be shorter');
  expect(dom.host.querySelector<HTMLInputElement>('input[name="title"]')!.value).toBe('Roadmap');
  expect(onCreated).not.toHaveBeenCalled();
});
