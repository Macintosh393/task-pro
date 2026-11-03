import type { BoardSummary, WorkspaceUser } from '../components/workspace/workspace-types';

export const workspaceBoards: readonly BoardSummary[] = [
  { id: 'project-office', title: 'Project office' },
  { id: 'neon-light', title: 'Neon Light Project' },
];

export const workspaceUser: WorkspaceUser = {
  username: 'Preview user',
  email: 'preview@example.test',
};
