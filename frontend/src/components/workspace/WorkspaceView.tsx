import { AppShell } from './AppShell';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceSidebar } from './sidebar/WorkspaceSidebar';
import { WorkspaceBoard } from './WorkspaceBoard';
import type {
  WorkspaceActiveBoard,
  WorkspaceBoard as Board,
  WorkspaceViewProps,
} from './workspace-types';

const noop = () => {};
const noBoards: readonly Board[] = [];
const idleBoard: WorkspaceActiveBoard = { status: 'idle' };

export function WorkspaceView({
  user,
  boards = noBoards,
  boardsStatus = 'ready',
  activeBoardId,
  activeBoard = idleBoard,
  onCreateBoard = noop,
  onSelectBoard = noop,
  onEditBoard = noop,
  onDeleteBoard = noop,
  onRetryBoards = noop,
  onOpenHelp = noop,
  onLogout = noop,
  logoutPending,
}: WorkspaceViewProps) {
  return (
    <AppShell
      header={({ menuButtonProps }) => (
        <WorkspaceHeader user={user} menuButtonProps={menuButtonProps} />
      )}
      sidebar={({ closeNavigation }) => (
        <WorkspaceSidebar
          boards={boards}
          status={boardsStatus}
          activeBoardId={activeBoardId}
          onCreateBoard={() => {
            // On mobile/tablet the drawer gives way to the create modal.
            closeNavigation();
            onCreateBoard();
          }}
          onSelectBoard={(board) => {
            onSelectBoard(board);
            closeNavigation();
          }}
          onEditBoard={onEditBoard}
          onDeleteBoard={onDeleteBoard}
          onRetryBoards={onRetryBoards}
          onOpenHelp={onOpenHelp}
          onLogout={onLogout}
          logoutPending={logoutPending}
        />
      )}
    >
      <WorkspaceBoard activeBoard={activeBoard} />
    </AppShell>
  );
}
