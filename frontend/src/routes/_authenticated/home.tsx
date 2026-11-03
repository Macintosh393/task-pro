import { useAuth } from '../../features/auth';
import { WorkspaceView } from '../../components/workspace/WorkspaceView';
import { useNavigate } from '@tanstack/react-router';

export function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    await navigate({ to: '/', replace: true });
  };

  return (
    <WorkspaceView
      user={{ username: user?.username || 'User', email: user?.email ?? '' }}
      onLogout={() => void handleLogout()}
      boards={[]}
      onSelectBoard={() => {}}
    />
  );
}
