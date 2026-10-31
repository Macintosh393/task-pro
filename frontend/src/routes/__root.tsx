import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import type { AuthContextType } from '../features/auth';

export interface RouterContext {
  queryClient: QueryClient;
  auth: AuthContextType;
}

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: () => <Outlet />,
});
