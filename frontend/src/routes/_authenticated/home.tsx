import { useAuth } from '../../features/auth';
import { WorkspaceView } from '../../components/workspace/WorkspaceView';

export function HomePage() {
  const { user } = useAuth();

  return (
    <WorkspaceView
      user={{
        username: user?.username || 'User',
        email: user?.email ?? '',
        avatarUrl: user?.avatarUrl,
      }}
    />
  );
}
