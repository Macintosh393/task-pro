import './WorkspaceBoard.css';
import type { ReactNode } from 'react';

export interface WorkspaceBoardProps {
  title: string;
  children?: ReactNode;
}

export function WorkspaceBoard({ title, children }: WorkspaceBoardProps) {
  return (
    <section className="workspace-board" aria-label="Board workspace">
      <div className="workspace-board__heading">
        <h1>{title}</h1>
      </div>
      <div className="workspace-canvas" tabIndex={0} role="region" aria-label="Board canvas">
        {children ?? <p className="workspace-empty">Your boards and projects will appear here.</p>}
      </div>
    </section>
  );
}
