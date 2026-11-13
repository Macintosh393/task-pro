import type { BoardBackground, BoardIcon } from '../ui';

export interface WorkspaceUser {
  username: string;
  email: string;
}

export interface WorkspaceBoard {
  id: string;
  title: string;
  icon: BoardIcon;
}

export type WorkspaceBoardsStatus = 'loading' | 'ready' | 'error';

/** What the board area shows; title and background always come from the active board. */
export type WorkspaceActiveBoard =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'not-found'; onBack: () => void }
  | { status: 'error'; onRetry: () => void }
  | { status: 'ready'; board: { title: string; background: BoardBackground } };

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
  activeBoard?: WorkspaceActiveBoard;
  onCreateBoard?: () => void;
  onSelectBoard?: (board: WorkspaceBoard) => void;
  onEditBoard?: (board: WorkspaceBoard) => void;
  onDeleteBoard?: (board: WorkspaceBoard) => void;
  onRetryBoards?: () => void;
  onOpenHelp?: () => void;
  onLogout?: () => void | Promise<void>;
  logoutPending?: boolean;
}
