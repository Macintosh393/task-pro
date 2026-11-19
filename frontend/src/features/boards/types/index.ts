import type { BoardBackground, BoardIcon } from '../../../components/ui';

export interface Board {
  id: string;
  title: string;
  icon: BoardIcon;
  background: BoardBackground;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBoardInput {
  title: string;
  icon: BoardIcon;
  background: BoardBackground;
}
