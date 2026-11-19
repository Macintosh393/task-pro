import { focusRing } from '../../ui/control-styles';
import { cn } from '../../ui/cn';

export function WorkspaceEmptyState({ onCreateBoard }: { onCreateBoard: () => void }) {
  return (
    <div className="flex min-h-full items-center justify-center py-6">
      <p className="workspace-empty m-0 max-w-[335px] text-center text-xs/4 tracking-[-0.02em] text-text-description min-[768px]:max-w-[486px] min-[768px]:text-sm/[18px]">
        Before starting your project, it is essential{' '}
        <button
          type="button"
          onClick={onCreateBoard}
          className={cn(
            'cursor-pointer rounded-sm text-sidebar-help-accent underline-offset-2 hover:underline',
            focusRing,
          )}
        >
          to create a board
        </button>{' '}
        to visualize and track all the necessary tasks and milestones. This board serves as a
        powerful tool to organize the workflow and ensure effective collaboration among team
        members.
      </p>
    </div>
  );
}
