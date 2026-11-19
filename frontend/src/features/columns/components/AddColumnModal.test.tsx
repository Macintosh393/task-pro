// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { setupDomTest } from '../../../test/setupDomTest';
import * as api from '../api/columns.api';
import { columnKeys } from '../queries/column-queries';
import type { Column } from '../types';
import { AddColumnModal } from './AddColumnModal';

vi.mock('../api/columns.api', () => ({
  getColumns: vi.fn(),
  createColumn: vi.fn(),
}));

const dom = setupDomTest();
const boardId = '0b1e7f6a-1d2c-4e5f-8a9b-0c1d2e3f4a5b';

const column = (id: string, title: string, position: number): Column => ({
  id,
  boardId,
  title,
  position,
  createdAt: '2026-11-19T10:00:00.000Z',
  updatedAt: '2026-11-19T10:00:00.000Z',
});
const todo = column('c0000000-0000-4000-8000-000000000001', 'To Do', 0);
const done = column('c0000000-0000-4000-8000-000000000002', 'Done', 1);

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open');
  };
});

afterEach(() => vi.clearAllMocks());

function renderModal(props: Partial<Parameters<typeof AddColumnModal>[0]> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  queryClient.setQueryData(columnKeys.list('u1', boardId), [todo]);
  const onCreated = vi.fn();
  const onClose = vi.fn();
  act(() =>
    dom.root.render(
      <QueryClientProvider client={queryClient}>
        <AddColumnModal
          open
          userId="u1"
          boardId={boardId}
          onClose={onClose}
          onCreated={onCreated}
          {...props}
        />
      </QueryClientProvider>,
    ),
  );
  return { onCreated, onClose, queryClient };
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

it('opens with an empty title and an Add button', () => {
  renderModal();
  expect(dom.host.querySelector('dialog')?.hasAttribute('open')).toBe(true);
  expect(dom.host.querySelector('h2')?.textContent).toBe('Add column');
  expect(dom.host.querySelector<HTMLInputElement>('input[name="title"]')!.value).toBe('');
  expect(dom.host.querySelector('button[type="submit"]')?.textContent).toBe('Add');
});

it('requires a title before sending a request', async () => {
  const { onCreated } = renderModal();
  typeTitle('   ');
  await submit();
  expect(dom.host.textContent).toContain('Title is required');
  expect(api.createColumn).not.toHaveBeenCalled();
  expect(onCreated).not.toHaveBeenCalled();
});

it('sends the trimmed title and appends the column to the board cache', async () => {
  vi.mocked(api.createColumn).mockResolvedValue(done);
  vi.mocked(api.getColumns).mockResolvedValue([todo, done]);
  const { onCreated, queryClient } = renderModal();
  typeTitle('  Done ');
  await submit();
  expect(api.createColumn).toHaveBeenCalledExactlyOnceWith(boardId, { title: 'Done' });
  expect(onCreated).toHaveBeenCalledExactlyOnceWith(done);
  expect(queryClient.getQueryData(columnKeys.list('u1', boardId))).toEqual([todo, done]);
});

it('shows the server error and keeps the entered title', async () => {
  vi.mocked(api.createColumn).mockRejectedValue({
    response: { status: 400, data: { message: ['title must be shorter'] } },
  });
  const { onCreated } = renderModal();
  typeTitle('Done');
  await submit();
  expect(dom.host.querySelector('[role="alert"]')?.textContent).toBe('title must be shorter');
  expect(dom.host.querySelector<HTMLInputElement>('input[name="title"]')!.value).toBe('Done');
  expect(onCreated).not.toHaveBeenCalled();
});

it('falls back to a generic message when the server gives none', async () => {
  vi.mocked(api.createColumn).mockRejectedValue(new Error('Network Error'));
  renderModal();
  typeTitle('Done');
  await submit();
  expect(dom.host.querySelector('[role="alert"]')?.textContent).toBe(
    'Could not add the column. Please try again.',
  );
});
