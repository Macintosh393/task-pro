import { apiClient } from '../../../lib/api-client';
import type { Board, CreateBoardInput } from '../types';

export const getBoards = async (): Promise<Board[]> => {
  const response = await apiClient.get<Board[]>('/boards');
  return response.data;
};

export const getBoard = async (boardId: string): Promise<Board> => {
  const response = await apiClient.get<Board>(`/boards/${encodeURIComponent(boardId)}`);
  return response.data;
};

export const createBoard = async (input: CreateBoardInput): Promise<Board> => {
  const response = await apiClient.post<Board>('/boards', input);
  return response.data;
};
