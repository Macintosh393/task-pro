import type { ReactNode } from 'react';

export interface BoardSummary {
  id: string;
  title: string;
}

export interface WorkspaceUser {
  username: string;
  email: string;
}

export interface WorkspaceViewProps {
  user: WorkspaceUser;
  onLogout: () => void;
  boards: readonly BoardSummary[];
  activeBoardId?: string;
  onSelectBoard: (boardId: string) => void;
  boardContent?: ReactNode;
}
