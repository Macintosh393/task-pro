import { useSearch } from '@tanstack/react-router';
import { LoginForm } from '../features/auth';

interface LoginSearch {
  redirect?: string;
}

export function LoginPage() {
  const search = useSearch({ strict: false }) as LoginSearch;
  const redirectTo = search.redirect || '/home';

  return (
    <main
      className="flex min-h-dvh w-full items-center justify-center bg-surface-canvas p-4 text-primary"
      style={{
        backgroundImage:
          'linear-gradient(180deg, var(--palette-neutral-100) 0%, var(--palette-green-300) 100%)',
      }}
    >
      <div className="w-full max-w-[424px] rounded-lg bg-surface-card p-10 shadow-sm">
        <LoginForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}
