import { useAuth } from '../../features/auth';
import { Button } from '../../components/ui';

export function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen w-full bg-surface-canvas p-6 text-primary">
      <header className="mx-auto flex max-w-5xl items-center justify-between border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-xl font-bold">Welcome back, {user?.username || 'User'}!</h1>
          <p className="text-sm text-text-description">{user?.email}</p>
        </div>
        <Button variant="secondary" size="small" onClick={() => logout()}>
          Log Out
        </Button>
      </header>
      <main className="mx-auto mt-8 max-w-5xl">
        <p className="text-sm text-text-description">Your boards and projects will appear here.</p>
      </main>
    </div>
  );
}
