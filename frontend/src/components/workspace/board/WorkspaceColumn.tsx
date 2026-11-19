import { Button, IconButton } from '../../ui';
import type { WorkspaceColumn as Column } from '../workspace-types';

interface WorkspaceColumnProps {
  column: Column;
  onEdit: (column: Column) => void;
  onDelete: (column: Column) => void;
  onAddCard: (column: Column) => void;
}

const actionClass = 'size-6 min-h-6';

export function WorkspaceColumn({ column, onEdit, onDelete, onAddCard }: WorkspaceColumnProps) {
  return (
    <li className="workspace-column flex max-h-full w-[min(335px,calc(100vw-40px))] shrink-0 flex-col gap-3.5 min-[768px]:w-[334px]">
      <div className="workspace-column__header flex min-h-14 shrink-0 items-center gap-2 rounded-lg bg-surface-column-heading py-2 ps-5 pe-5 text-primary">
        <h2
          title={column.title}
          className="m-0 min-w-0 flex-1 truncate text-sm/normal font-medium tracking-[-0.02em]"
        >
          {column.title}
        </h2>
        <IconButton
          variant="ghost"
          icon="edit"
          iconSize={16}
          aria-label={`Edit column ${column.title}`}
          className={actionClass}
          onClick={() => onEdit(column)}
        />
        <IconButton
          variant="ghost"
          icon="trash"
          iconSize={16}
          aria-label={`Delete column ${column.title}`}
          className={actionClass}
          onClick={() => onDelete(column)}
        />
      </div>
      {/* Own vertical scroll for cards (#44); the scrollbar sits in the gap after the column. */}
      <div className="workspace-column__cards -me-4 min-h-0 overflow-y-auto overscroll-y-contain pe-1.5[scrollbar-color:var(--text-caption)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin] empty:hidden" />
      <Button
        size="large"
        fullWidth
        leadingIcon="boxed-plus"
        aria-label={`Add another card to ${column.title}`}
        className="workspace-column__add-card shrink-0"
        onClick={() => onAddCard(column)}
      >
        Add another card
      </Button>
    </li>
  );
}
