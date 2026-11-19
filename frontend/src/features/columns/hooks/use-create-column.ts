import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createColumn } from '../api/columns.api';
import { columnKeys } from '../queries/column-queries';
import type { Column, CreateColumnInput } from '../types';

export function useCreateColumn(userId: string, boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateColumnInput) => createColumn(boardId, input),
    onSuccess: async (column) => {
      // The backend appends, so the new column goes last, right before Add another column.
      queryClient.setQueryData<Column[]>(columnKeys.list(userId, boardId), (columns) =>
        columns && !columns.some((item) => item.id === column.id) ? [...columns, column] : columns,
      );
      await queryClient.invalidateQueries({ queryKey: columnKeys.list(userId, boardId) });
    },
  });
}
