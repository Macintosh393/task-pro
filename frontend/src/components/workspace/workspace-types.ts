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

export interface WorkspaceColumn {
  id: string;
  title: string;
}

/** Columns of the active board, already in their stored order. */
export type WorkspaceColumnsState =
  | { status: 'loading' }
  | { status: 'error'; onRetry: () => void }
  | { status: 'ready'; columns: readonly WorkspaceColumn[] };

/** Board-area actions; rename/delete columns (#41/#42) and Add another card (#89) are wired later. */
export interface WorkspaceBoardActions {
  onCreateBoard?: () => void;
  onAddColumn?: () => void;
  onEditColumn?: (column: WorkspaceColumn) => void;
  onDeleteColumn?: (column: WorkspaceColumn) => void;
  onAddCard?: (column: WorkspaceColumn) => void;
}

/** What the board area shows; title and background always come from the active board. */
export type WorkspaceActiveBoard =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'not-found'; onBack: () => void }
  | { status: 'error'; onRetry: () => void }
  | {
      status: 'ready';
      board: { title: string; background: BoardBackground };
      columns: WorkspaceColumnsState;
    };

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

export interface WorkspaceViewProps extends Omit<WorkspaceBoardActions, 'onCreateBoard'> {
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
