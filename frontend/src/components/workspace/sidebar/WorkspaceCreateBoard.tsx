import { IconButton } from '../../ui';

export function WorkspaceCreateBoard({ onCreateBoard }: { onCreateBoard: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-y border-sidebar-divider py-2">
      <span className="min-w-0 text-sm font-medium text-sidebar">
        Create a<br />
        new board
      </span>
      <IconButton
        treatment="compact-add"
        icon="plus"
        aria-label="Create a new board"
        onClick={onCreateBoard}
      />
    </div>
  );
}
