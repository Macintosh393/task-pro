import { queryOptions } from '@tanstack/react-query';
import { boardKeys, retryUnlessClientError } from '../../boards/queries/board-queries';
import { getColumns } from '../api/columns.api';

/** Nested under the board detail key, so they stay scoped to the user and the board. */
export const columnKeys = {
  list: (userId: string, boardId: string) =>
    [...boardKeys.detail(userId, boardId), 'columns'] as const,
};

export function columnsQueryOptions(userId: string, boardId: string) {
  return queryOptions({
    queryKey: columnKeys.list(userId, boardId),
    queryFn: () => getColumns(boardId),
    retry: retryUnlessClientError,
  });
}
