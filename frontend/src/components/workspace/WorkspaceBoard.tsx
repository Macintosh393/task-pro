import { Button, Icon } from '../ui';
import type { WorkspaceViewProps } from './workspace-types';

export function WorkspaceBoard({
  activeBoard = null,
  onOpenFilters,
}: Pick<WorkspaceViewProps, 'activeBoard' | 'onOpenFilters'>) {
  return (
    <section
      className="workspace-board flex h-full min-h-0 min-w-0 flex-col"
      aria-label="Board workspace"
    >
      <div className="workspace-board__heading flex min-w-0 shrink-0 items-start justify-between gap-4 pb-[26px] min-[1440px]:pb-2">
        <h1
          title={activeBoard?.title}
          className="m-0 min-w-0 truncate text-sm/6 font-medium tracking-[-0.02em] min-[768px]:text-lg/7"
        >
          {activeBoard?.title ?? 'Your workspace'}
        </h1>
        <Button
          variant="ghost"
          size="small"
          onClick={onOpenFilters}
          disabled={!activeBoard || !onOpenFilters}
          className="-mt-2 shrink-0 gap-2 border-0 px-0 text-primary/80 disabled:bg-transparent disabled:text-primary/80"
        >
          <Icon name="filter" size={16} />
          Filters
        </Button>
      </div>
      <div
        className="workspace-canvas min-h-0 min-w-0 flex-1 overflow-auto overscroll-x-contain focus-visible:outline-(length:--focus-ring-width) focus-visible:outline-solid focus-visible:outline-focus-ring focus-visible:outline-offset-[-2px]"
        tabIndex={0}
        role="region"
        aria-label="Board canvas"
      >
        <p className="workspace-empty m-auto max-w-[480px] py-6 text-[14px] text-text-description">
          Your boards and projects will appear here.
        </p>
      </div>
    </section>
  );
}
