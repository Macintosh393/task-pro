import { Button } from '../../ui';
import type { WorkspaceColumn as Column, WorkspaceColumnsState } from '../workspace-types';
import { WorkspaceColumn } from './WorkspaceColumn';

interface WorkspaceColumnsProps {
  state: WorkspaceColumnsState;
  onAddColumn: () => void;
  onEditColumn: (column: Column) => void;
  onDeleteColumn: (column: Column) => void;
  onAddCard: (column: Column) => void;
}

const columnWidth = 'w-[min(335px,calc(100vw-40px))] shrink-0 min-[768px]:w-[334px]';

export function WorkspaceColumns({
  state,
  onAddColumn,
  onEditColumn,
  onDeleteColumn,
  onAddCard,
}: WorkspaceColumnsProps) {
  if (state.status === 'loading') {
    return (
      <div role="status" className="flex gap-[34px]">
        <span className="sr-only">Loading columns…</span>
        {[0, 1].map((index) => (
          <span
            key={index}
            aria-hidden="true"
            className={`${columnWidth} h-14 animate-pulse rounded-lg bg-surface-column-heading motion-reduce:animate-none`}
          />
        ))}
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="flex max-w-[480px] flex-col items-start gap-4 py-6">
        <p role="alert" className="m-0 text-[14px] text-text-description">
          Could not load the columns of this board.
        </p>
        <Button variant="secondary" size="small" onClick={state.onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="workspace-columns flex h-full w-max items-start gap-[34px]">
      <ol
        aria-label="Columns"
        className="workspace-columns__list m-0 flex h-full list-none items-start gap-[34px] p-0 empty:hidden"
      >
        {state.columns.map((column) => (
          <WorkspaceColumn
            key={column.id}
            column={column}
            onEdit={onEditColumn}
            onDelete={onDeleteColumn}
            onAddCard={onAddCard}
          />
        ))}
      </ol>
      {/* Always last on the right, after every column. */}
      <Button
        variant="neutral"
        size="large"
        leadingIcon="boxed-plus"
        className={`workspace-columns__add ${columnWidth}`}
        onClick={onAddColumn}
      >
        Add another column
      </Button>
    </div>
  );
}
