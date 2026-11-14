import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../../features/auth';
import { WorkspaceView } from '../../components/workspace/WorkspaceView';
import { EditProfileModal } from '../../features/auth/components/EditProfileModal';

export function HomePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

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
        user={{
          username: user?.username || 'User',
          email: user?.email ?? '',
          avatarUrl: user?.avatarUrl,
        }}
        onLogout={handleLogout}
        logoutPending={loggingOut}
        onEditProfile={() => setEditingProfile(true)}
      />
      {editingProfile && user && (
        <EditProfileModal user={user} onClose={() => setEditingProfile(false)} />
      )}
    </>
  );
}
