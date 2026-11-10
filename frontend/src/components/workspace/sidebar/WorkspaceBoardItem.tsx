import { Icon, IconButton } from '../../ui';
import { cn } from '../../ui/cn';
import type { WorkspaceBoard } from '../workspace-types';

interface WorkspaceBoardItemProps {
  board: WorkspaceBoard;
  active: boolean;
  onSelect: (board: WorkspaceBoard) => void;
  onEdit: (board: WorkspaceBoard) => void;
  onDelete: (board: WorkspaceBoard) => void;
}

export function WorkspaceBoardItem({
  board,
  active,
  onSelect,
  onEdit,
  onDelete,
}: WorkspaceBoardItemProps) {
  const actionClass = cn(
    'size-6 min-h-6 text-sidebar-label enabled:hover:text-sidebar focus-visible:outline-focus-ring-sidebar',
    !active &&
      '[@media(hover:hover)]:hidden group-focus-within/row:inline-flex group-hover/row:inline-flex',
  );

  return (
    <li
      className={cn(
        'group/row relative flex min-h-12 items-center gap-1 px-5 min-[768px]:px-6',
        active
          ? 'bg-surface-sidebar-selected'
          : 'focus-within:bg-surface-sidebar-hover hover:bg-surface-sidebar-hover',
      )}
    >
      <button
        type="button"
        title={board.title}
        aria-current={active ? 'true' : undefined}
        onClick={() => onSelect(board)}
        className={cn(
          'flex min-h-12 min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-left font-ui text-sm font-medium tracking-[-0.02em]',
          'focus-visible:-outline-offset-2 focus-visible:outline-(length:--focus-ring-width) focus-visible:outline-solid focus-visible:outline-focus-ring-sidebar',
          active
            ? 'text-sidebar'
            : 'text-sidebar-label group-focus-within/row:text-sidebar group-hover/row:text-sidebar',
        )}
      >
        <Icon name={board.icon} size={18} />
        <span className="min-w-0 truncate">{board.title}</span>
      </button>
      <IconButton
        variant="ghost"
        icon="edit"
        iconSize={16}
        aria-label={`Edit ${board.title}`}
        className={actionClass}
        onClick={() => onEdit(board)}
      />
      <IconButton
        variant="ghost"
        icon="trash"
        iconSize={16}
        aria-label={`Delete ${board.title}`}
        className={actionClass}
        onClick={() => onDelete(board)}
      />
      {active && (
        <span
          aria-hidden="true"
          className="absolute inset-y-0 right-0 w-1 rounded-l-sm bg-sidebar-active-indicator"
        />
      )}
    </li>
  );
}
