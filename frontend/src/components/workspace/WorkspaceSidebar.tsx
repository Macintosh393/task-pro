import { Button, Icon, Logo } from '../ui';
import type { WorkspaceViewProps } from './workspace-types';

export function WorkspaceSidebar({
  boards,
  activeBoardId,
  onSelectBoard,
  closeNavigation,
}: Pick<WorkspaceViewProps, 'boards' | 'activeBoardId' | 'onSelectBoard' | 'onLogout'> & {
  closeNavigation: () => void;
}) {
  return (
    <div className="workspace-sidebar flex min-h-0 grow shrink-0 flex-col gap-[60px] p-6 min-[1440px]:min-h-full">
      <Logo />
      <nav aria-label="My boards" className="workspace-boards flex min-w-0 flex-col gap-3">
        <h2 className="m-0 text-[12px] font-normal text-sidebar">My boards</h2>
        {boards.length === 0 ? (
          <p className="workspace-sidebar__empty text-[12px] wrap-anywhere text-sidebar">
            Your boards will appear here.
          </p>
        ) : (
          boards.map((board) => (
            <Button
              key={board.id}
              variant="ghost"
              size="small"
              className="workspace-board-link justify-start gap-2 px-0 text-left text-sidebar enabled:hover:text-sidebar aria-[current]:font-semibold aria-[current]:underline aria-[current]:underline-offset-4"
              aria-current={board.id === activeBoardId ? 'page' : undefined}
              onClick={() => {
                onSelectBoard(board.id);
                closeNavigation();
              }}
            >
              <Icon name="project" size={18} />
              <span className="min-w-0 wrap-anywhere">{board.title}</span>
            </Button>
          ))
        )}
      </nav>
    </div>
  );
}
