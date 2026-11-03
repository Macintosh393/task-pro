import { AppShell } from './AppShell';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceBoard } from './WorkspaceBoard';
import type { WorkspaceViewProps } from './workspace-types';

export function WorkspaceView({
  user,
  onLogout,
  boards,
  activeBoardId,
  onSelectBoard,
  boardContent,
}: WorkspaceViewProps) {
  const activeBoard = boards.find((board) => board.id === activeBoardId);
  return (
    <AppShell
      header={({ menuButtonProps }) => (
        <WorkspaceHeader user={user} onLogout={onLogout} menuButtonProps={menuButtonProps} />
      )}
      sidebar={({ closeNavigation }) => (
        <WorkspaceSidebar
          boards={boards}
          activeBoardId={activeBoardId}
          onSelectBoard={onSelectBoard}
          closeNavigation={closeNavigation}
        />
      )}
    >
      <WorkspaceBoard title={activeBoard?.title ?? 'Your workspace'}>{boardContent}</WorkspaceBoard>
    </AppShell>
  );
}
