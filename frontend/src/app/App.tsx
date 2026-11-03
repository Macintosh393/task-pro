import { lazy, Suspense } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './query-client';
import { router } from './router';
import { AuthProvider, useAuth } from '../features/auth';
import { SessionLoader } from '../components/feedback/session-loader';

function InnerApp() {
  const auth = useAuth();

  if (auth.isLoading) {
    return <SessionLoader />;
  }

  return <RouterProvider router={router} context={{ queryClient }} />;
}

const WorkspacePreview = import.meta.env.DEV ? lazy(() => import('../dev/WorkspacePreview')) : null;

export function App() {
  if (import.meta.env.DEV && window.location.pathname === '/dev/workspace' && WorkspacePreview) {
    return (
      <Suspense fallback={<SessionLoader />}>
        <WorkspacePreview />
      </Suspense>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
