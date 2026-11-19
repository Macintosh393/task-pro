import { apiClient } from '../../../lib/api-client';
import type { Column, CreateColumnInput } from '../types';

const columnsPath = (boardId: string) => `/boards/${encodeURIComponent(boardId)}/columns`;

/** Columns of a board in their stored order (the backend sorts by `position`). */
export const getColumns = async (boardId: string): Promise<Column[]> => {
  const response = await apiClient.get<Column[]>(columnsPath(boardId));
  return response.data;
};

/** Appends a column to the end of the board. */
export const createColumn = async (boardId: string, input: CreateColumnInput): Promise<Column> => {
  const response = await apiClient.post<Column>(columnsPath(boardId), input);
  return response.data;
};
