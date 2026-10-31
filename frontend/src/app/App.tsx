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

  return <RouterProvider router={router} context={{ queryClient, auth }} />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
