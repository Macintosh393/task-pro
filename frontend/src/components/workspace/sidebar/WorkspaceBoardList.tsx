import { Button } from '../../ui';
import type { WorkspaceSidebarProps } from '../workspace-types';
import { WorkspaceBoardItem } from './WorkspaceBoardItem';

type WorkspaceBoardListProps = Pick<
  WorkspaceSidebarProps,
  | 'boards'
  | 'status'
  | 'activeBoardId'
  | 'onSelectBoard'
  | 'onEditBoard'
  | 'onDeleteBoard'
  | 'onRetryBoards'
>;

export function WorkspaceBoardList({
  boards,
  status,
  activeBoardId,
  onSelectBoard,
  onEditBoard,
  onDeleteBoard,
  onRetryBoards,
}: WorkspaceBoardListProps) {
  return (
    <div className="workspace-board-list -mx-5 mt-10 min-h-24 flex-1 overflow-y-auto overscroll-contain [scrollbar-color:var(--text-sidebar-label)_transparent] [scrollbar-width:thin] min-[768px]:-mx-6">
      {status === 'loading' && (
        <div>
          <p role="status" className="m-0 mb-3 px-5 text-xs text-sidebar-label min-[768px]:px-6">
            Loading boards…
          </p>
          <div aria-hidden="true" className="flex flex-col gap-1">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="h-12 animate-pulse bg-surface-sidebar-selected motion-reduce:animate-none"
              />
            ))}
          </div>
        </div>
      )}
      {status === 'error' && (
        <div className="flex flex-col items-start gap-3 px-5 min-[768px]:px-6">
          <p role="alert" className="m-0 text-xs text-sidebar-label">
            Could not load your boards.
          </p>
          <Button variant="secondary" size="small" onClick={onRetryBoards}>
            Try again
          </Button>
        </div>
      )}
      {status === 'ready' && boards.length === 0 && (
        <p className="m-0 px-5 text-xs wrap-anywhere text-sidebar-label min-[768px]:px-6">
          Your boards will appear here.
        </p>
      )}
      {status === 'ready' && boards.length > 0 && (
        <ul className="m-0 flex list-none flex-col p-0">
          {boards.map((board) => (
            <WorkspaceBoardItem
              key={board.id}
              board={board}
              active={board.id === activeBoardId}
              onSelect={onSelectBoard}
              onEdit={onEditBoard}
              onDelete={onDeleteBoard}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
