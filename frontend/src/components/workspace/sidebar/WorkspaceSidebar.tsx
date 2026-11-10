import { Logo, LogoutButton } from '../../ui';
import type { WorkspaceSidebarProps } from '../workspace-types';
import { WorkspaceBoardList } from './WorkspaceBoardList';
import { WorkspaceCreateBoard } from './WorkspaceCreateBoard';
import { WorkspaceHelpCard } from './WorkspaceHelpCard';

export function WorkspaceSidebar({
  boards,
  status,
  activeBoardId,
  onCreateBoard,
  onSelectBoard,
  onEditBoard,
  onDeleteBoard,
  onRetryBoards,
  onOpenHelp,
  onLogout,
  logoutPending = false,
}: WorkspaceSidebarProps) {
  return (
    <div className="workspace-sidebar flex h-full min-h-0 flex-1 flex-col overflow-y-auto p-5 min-[768px]:p-6">
      <Logo className="shrink-0" />
      <nav aria-label="My boards" className="mt-[60px] flex min-h-56 flex-1 flex-col">
        <h2 className="m-0 mb-2 text-xs font-normal text-sidebar-label">My boards</h2>
        <WorkspaceCreateBoard onCreateBoard={onCreateBoard} />
        <WorkspaceBoardList
          boards={boards}
          status={status}
          activeBoardId={activeBoardId}
          onSelectBoard={onSelectBoard}
          onEditBoard={onEditBoard}
          onDeleteBoard={onDeleteBoard}
          onRetryBoards={onRetryBoards}
        />
      </nav>
      <div className="workspace-sidebar__footer mt-6 flex shrink-0 flex-col gap-4">
        <WorkspaceHelpCard onOpenHelp={onOpenHelp} />
        <LogoutButton
          className="self-start"
          loading={logoutPending}
          onClick={() => void onLogout()}
        />
      </div>
    </div>
  );
}
