import './WorkspaceSidebar.css';
import { Button, Icon, Logo } from '../ui';
import type { WorkspaceViewProps } from './workspace-types';

export function WorkspaceSidebar({
  boards,
  activeBoardId,
  onSelectBoard,
  closeNavigation,
}: Pick<WorkspaceViewProps, 'boards' | 'activeBoardId' | 'onSelectBoard'> & {
  closeNavigation: () => void;
}) {
  return (
    <div className="workspace-sidebar">
      <Logo />
      <nav aria-label="My boards" className="workspace-boards">
        <h2>My boards</h2>
        {boards.length === 0 ? (
          <p className="workspace-sidebar__empty">Your boards will appear here.</p>
        ) : (
          boards.map((board) => (
            <Button
              key={board.id}
              variant="ghost"
              size="small"
              className="workspace-board-link"
              aria-current={board.id === activeBoardId ? 'page' : undefined}
              onClick={() => {
                onSelectBoard(board.id);
                closeNavigation();
              }}
            >
              <Icon name="project" size={18} />
              <span>{board.title}</span>
            </Button>
          ))
        )}
      </nav>
    </div>
  );
}
