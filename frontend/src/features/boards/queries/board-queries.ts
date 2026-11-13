import { queryOptions, type QueryClient } from '@tanstack/react-query';
import { getBoard, getBoards } from '../api/boards.api';
import type { Board } from '../types';

/** Every boards key is scoped by user id, so cached boards never leak between accounts. */
export const boardKeys = {
  all: ['boards'] as const,
  user: (userId: string) => [...boardKeys.all, userId] as const,
  list: (userId: string) => [...boardKeys.user(userId), 'list'] as const,
  detail: (userId: string, boardId: string) =>
    [...boardKeys.user(userId), 'detail', boardId] as const,
};

function responseStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } } | null)?.response?.status;
}

/** Unknown, foreign (404) and malformed (400) ids are all "not found" for the user. */
export function isBoardNotFound(error: unknown): boolean {
  const status = responseStatus(error);
  return status === 404 || status === 400;
}

export function boardsQueryOptions(userId: string) {
  return queryOptions({
    queryKey: boardKeys.list(userId),
    queryFn: getBoards,
  });
}

export function boardQueryOptions(queryClient: QueryClient, userId: string, boardId: string) {
  const listKey = boardKeys.list(userId);
  return queryOptions({
    queryKey: boardKeys.detail(userId, boardId),
    queryFn: () => getBoard(boardId),
    initialData: () =>
      queryClient.getQueryData<Board[]>(listKey)?.find((board) => board.id === boardId),
    initialDataUpdatedAt: () => queryClient.getQueryState(listKey)?.dataUpdatedAt,
    retry: (failureCount, error) => {
      const status = responseStatus(error);
      if (status === 400 || status === 401 || status === 403 || status === 404) return false;
      return failureCount < 2;
    },
  });
}
