import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBoard } from '../api/boards.api';
import { boardKeys } from '../queries/board-queries';
import type { Board } from '../types';

export function useCreateBoard(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBoard,
    onSuccess: async (board) => {
      queryClient.setQueryData<Board[]>(boardKeys.list(userId), (boards) =>
        boards && !boards.some((item) => item.id === board.id) ? [...boards, board] : boards,
      );
      queryClient.setQueryData(boardKeys.detail(userId, board.id), board);
      await queryClient.invalidateQueries({ queryKey: boardKeys.list(userId) });
    },
  });
}
