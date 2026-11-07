import { AppShell } from './AppShell';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceSidebar } from './WorkspaceSidebar';
import { WorkspaceBoard } from './WorkspaceBoard';
import type { WorkspaceViewProps } from './workspace-types';

export function WorkspaceView({
  user,
  activeBoard = null,
  onEditProfile,
  onOpenFilters,
}: WorkspaceViewProps) {
  return (
    <AppShell
      header={({ menuButtonProps }) => (
        <WorkspaceHeader
          user={user}
          menuButtonProps={menuButtonProps}
          onEditProfile={onEditProfile}
        />
      )}
      sidebar={() => <WorkspaceSidebar />}
    >
      <WorkspaceBoard activeBoard={activeBoard} onOpenFilters={onOpenFilters} />
    </AppShell>
  );
}
