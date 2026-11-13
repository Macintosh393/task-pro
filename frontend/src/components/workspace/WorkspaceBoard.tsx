import type { CSSProperties } from 'react';
import { getBoardBackgroundImage } from './board-backgrounds';
import { Button } from '../ui';
import { cn } from '../ui/cn';
import type { WorkspaceActiveBoard } from './workspace-types';

export interface WorkspaceBoardProps {
  activeBoard?: WorkspaceActiveBoard;
}

const idleBoard: WorkspaceActiveBoard = { status: 'idle' };

function headingFor(activeBoard: WorkspaceActiveBoard) {
  switch (activeBoard.status) {
    case 'ready':
      return activeBoard.board.title;
    case 'not-found':
      return 'Board not found';
    case 'error':
      return 'Board unavailable';
    default:
      return 'Your workspace';
  }
}

export function WorkspaceBoard({ activeBoard = idleBoard }: WorkspaceBoardProps) {
  const image =
    activeBoard.status === 'ready' ? getBoardBackgroundImage(activeBoard.board.background) : null;
  // Dynamic per-board values only; the utilities below pick the viewport-sized asset.
  const backgroundVars = image
    ? ({
        '--board-bg-mobile': `url("${image.mobile}")`,
        '--board-bg-tablet': `url("${image.tablet}")`,
        '--board-bg-desktop': `url("${image.desktop}")`,
      } as CSSProperties)
    : undefined;

  return (
    <section
      className={cn(
        'workspace-board flex h-full min-h-0 min-w-0 flex-col px-5 pt-3.5 pb-5 min-[768px]:px-8 min-[768px]:pt-[26px] min-[768px]:pb-8 min-[1440px]:px-6 min-[1440px]:pt-2.5 min-[1440px]:pb-2',
        image &&
          'bg-(image:--board-bg-mobile) bg-cover bg-center bg-no-repeat min-[768px]:bg-(image:--board-bg-tablet) min-[1440px]:bg-(image:--board-bg-desktop)',
      )}
      style={backgroundVars}
      data-board-background={
        activeBoard.status === 'ready' ? activeBoard.board.background : undefined
      }
      aria-label="Board workspace"
      aria-busy={activeBoard.status === 'loading' || undefined}
    >
      <div className="workspace-board__heading shrink-0 pb-[26px] min-[1440px]:pb-2">
        {activeBoard.status === 'loading' ? (
          <div role="status" className="flex h-6 items-center min-[768px]:h-7">
            <span className="sr-only">Loading board…</span>
            <span
              aria-hidden="true"
              className="h-4 w-40 animate-pulse rounded-md bg-surface-card motion-reduce:animate-none"
            />
          </div>
        ) : (
          <h1 className="m-0 text-sm/6 font-medium wrap-anywhere min-[768px]:text-lg/7">
            {headingFor(activeBoard)}
          </h1>
        )}
      </div>
      <div
        className="workspace-canvas min-h-0 min-w-0 flex-1 overflow-auto overscroll-x-contain focus-visible:outline-(length:--focus-ring-width) focus-visible:outline-solid focus-visible:outline-focus-ring focus-visible:outline-offset-[-2px]"
        tabIndex={0}
        role="region"
        aria-label="Board canvas"
      >
        {activeBoard.status === 'idle' && (
          <p className="workspace-empty m-auto max-w-[480px] py-6 text-[14px] text-text-description">
            Select a board in the sidebar or create a new one to get started.
          </p>
        )}
        {activeBoard.status === 'not-found' && (
          <div className="flex max-w-[480px] flex-col items-start gap-4 py-6">
            <p className="m-0 text-[14px] text-text-description">
              This board does not exist or you do not have access to it.
            </p>
            <Button variant="secondary" size="small" onClick={activeBoard.onBack}>
              Back to workspace
            </Button>
          </div>
        )}
        {activeBoard.status === 'error' && (
          <div className="flex max-w-[480px] flex-col items-start gap-4 py-6">
            <p role="alert" className="m-0 text-[14px] text-text-description">
              Could not load this board.
            </p>
            <Button variant="secondary" size="small" onClick={activeBoard.onRetry}>
              Try again
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
