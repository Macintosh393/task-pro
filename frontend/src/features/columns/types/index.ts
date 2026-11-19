export interface Column {
  id: string;
  boardId: string;
  title: string;
  /** 0-based place on the board; may have gaps after deletions, order is what counts. */
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateColumnInput {
  title: string;
}
