// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setupDomTest } from '../../../test/setupDomTest';
import * as api from '../api/boards.api';
import { useCreateBoard } from '../hooks/use-create-board';
import type { Board } from '../types';
import { boardKeys, boardQueryOptions, isBoardNotFound } from './board-queries';

vi.mock('../api/boards.api', () => ({
  getBoards: vi.fn(),
  getBoard: vi.fn(),
  createBoard: vi.fn(),
}));

const dom = setupDomTest();

const board = (id: string, title = id): Board => ({
  id,
  title,
  icon: 'project',
  background: 'none',
  createdAt: '2026-11-13T10:00:00.000Z',
  updatedAt: '2026-11-13T10:00:00.000Z',
});

afterEach(() => vi.clearAllMocks());

describe('board queries', () => {
  it('scopes every key by user', () => {
    expect(boardKeys.list('u1')).not.toEqual(boardKeys.list('u2'));
    expect(boardKeys.detail('u1', 'b')).toEqual(['boards', 'u1', 'detail', 'b']);
    expect(boardKeys.list('u1').slice(0, 1)).toEqual(boardKeys.all);
  });

  it('seeds the active board from the cached list', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(boardKeys.list('u1'), [board('a'), board('b', 'Beta')]);
    const options = boardQueryOptions(queryClient, 'u1', 'b');
    expect((options.initialData as () => Board | undefined)()).toEqual(board('b', 'Beta'));
  });

  it('treats 404 and 400 as not found', () => {
    expect(isBoardNotFound({ response: { status: 404 } })).toBe(true);
    expect(isBoardNotFound({ response: { status: 400 } })).toBe(true);
    expect(isBoardNotFound({ response: { status: 500 } })).toBe(false);
    expect(isBoardNotFound(new Error('offline'))).toBe(false);
  });

  it('appends a created board to the list and seeds its detail', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(boardKeys.list('u1'), [board('a')]);
    vi.mocked(api.createBoard).mockResolvedValue(board('c', 'Created'));
    vi.mocked(api.getBoards).mockResolvedValue([board('a'), board('c', 'Created')]);

    let create: ReturnType<typeof useCreateBoard> | undefined;
    function Probe() {
      create = useCreateBoard('u1');
      return null;
    }
    const wrap = (node: ReactNode) => (
      <QueryClientProvider client={queryClient}>{node}</QueryClientProvider>
    );
    act(() => dom.root.render(wrap(<Probe />)));

    await act(async () => {
      await create!.mutateAsync({ title: 'Created', icon: 'project', background: 'none' });
    });

    expect(queryClient.getQueryData<Board[]>(boardKeys.list('u1'))?.map((b) => b.id)).toEqual([
      'a',
      'c',
    ]);
    expect(queryClient.getQueryData(boardKeys.detail('u1', 'c'))).toEqual(board('c', 'Created'));
  });
});
