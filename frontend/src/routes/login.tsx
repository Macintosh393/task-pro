import { useSearch } from '@tanstack/react-router';
import { LoginForm } from '../features/auth';
import { Logo } from '../components/ui';

interface LoginSearch {
  redirect?: string;
}

export function LoginPage() {
  const search = useSearch({ strict: false }) as LoginSearch;
  const redirectTo = search.redirect || '/home';

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-surface-canvas p-4 text-primary">
      <div className="flex w-full max-w-[424px] flex-col items-center rounded-lg bg-surface-card p-6 shadow-sm sm:p-10">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Logo />
          <h1 className="font-ui text-lg font-semibold tracking-[-0.02em] text-primary">
            Log In to TaskPro
          </h1>
        </div>
        <LoginForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}
