import type { BoardIcon } from '../ui';

export interface WorkspaceUser {
  username: string;
  email: string;
  avatarUrl?: string | null;
}

export interface WorkspaceBoard {
  id: string;
  title: string;
  icon: BoardIcon;
}

export type WorkspaceBoardsStatus = 'loading' | 'ready' | 'error';

export interface WorkspaceSidebarProps {
  boards: readonly WorkspaceBoard[];
  status: WorkspaceBoardsStatus;
  activeBoardId?: string | null;
  onCreateBoard: () => void;
  onSelectBoard: (board: WorkspaceBoard) => void;
  onEditBoard: (board: WorkspaceBoard) => void;
  onDeleteBoard: (board: WorkspaceBoard) => void;
  onRetryBoards: () => void;
  onOpenHelp: () => void;
  onLogout: () => void | Promise<void>;
  logoutPending?: boolean;
}

export interface WorkspaceViewProps {
  user: WorkspaceUser;
  boards?: readonly WorkspaceBoard[];
  boardsStatus?: WorkspaceBoardsStatus;
  activeBoardId?: string | null;
  onCreateBoard?: () => void;
  onSelectBoard?: (board: WorkspaceBoard) => void;
  onEditBoard?: (board: WorkspaceBoard) => void;
  onDeleteBoard?: (board: WorkspaceBoard) => void;
  onRetryBoards?: () => void;
  onOpenHelp?: () => void;
  onLogout?: () => void | Promise<void>;
  logoutPending?: boolean;
  onEditProfile?: () => void;
  onOpenFilters?: () => void;
}
