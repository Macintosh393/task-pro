import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { useAuth } from '../../features/auth';
import {
  boardIdSchema,
  boardQueryOptions,
  boardsQueryOptions,
  CreateBoardModal,
  isBoardNotFound,
} from '../../features/boards';
import { WorkspaceView } from '../../components/workspace/WorkspaceView';
import type {
  WorkspaceActiveBoard,
  WorkspaceBoardsStatus,
} from '../../components/workspace/workspace-types';

const homeRoute = getRouteApi('/_authenticated/home');

export function HomePage() {
  const { user, logout } = useAuth();
  const userId = user?.id ?? '';
  const { boardId } = homeRoute.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loggingOut, setLoggingOut] = useState(false);
  const [creating, setCreating] = useState(false);

  const boardsQuery = useQuery({ ...boardsQueryOptions(userId), enabled: Boolean(userId) });
  const validBoardId = boardId !== undefined && boardIdSchema.safeParse(boardId).success;
  // Keyed by boardId: a late response for a previous selection lands in its own cache entry
  // and never replaces the board the route points at now.
  const boardQuery = useQuery({
    ...boardQueryOptions(queryClient, userId, validBoardId ? boardId : ''),
    enabled: Boolean(userId) && validBoardId,
  });

  const boardsStatus: WorkspaceBoardsStatus =
    boardsQuery.status === 'pending'
      ? 'loading'
      : boardsQuery.status === 'error'
        ? 'error'
        : 'ready';

  const openWorkspace = () => void navigate({ to: '/home', search: {} });

  let activeBoard: WorkspaceActiveBoard = { status: 'idle' };
  if (boardId !== undefined) {
    if (!validBoardId || (boardQuery.isError && isBoardNotFound(boardQuery.error))) {
      activeBoard = { status: 'not-found', onBack: openWorkspace };
    } else if (boardQuery.data) {
      activeBoard = {
        status: 'ready',
        board: { title: boardQuery.data.title, background: boardQuery.data.background },
      };
    } else if (boardQuery.isError) {
      activeBoard = { status: 'error', onRetry: () => void boardQuery.refetch() };
    } else {
      activeBoard = { status: 'loading' };
    }
  }

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      await navigate({ to: '/', replace: true });
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <WorkspaceView
        user={{ username: user?.username || 'User', email: user?.email ?? '' }}
        boards={boardsQuery.data ?? []}
        boardsStatus={boardsStatus}
        activeBoardId={boardId ?? null}
        activeBoard={activeBoard}
        onCreateBoard={() => setCreating(true)}
        onSelectBoard={(board) => void navigate({ to: '/home', search: { boardId: board.id } })}
        onRetryBoards={() => void boardsQuery.refetch()}
        onLogout={handleLogout}
        logoutPending={loggingOut}
      />
      {/* Rendered after WorkspaceView so the drawer closes before the modal opens. */}
      <CreateBoardModal
        open={creating}
        userId={userId}
        onClose={() => setCreating(false)}
        onCreated={(board) => {
          setCreating(false);
          void navigate({ to: '/home', search: { boardId: board.id } });
        }}
      />
    </>
  );
}
