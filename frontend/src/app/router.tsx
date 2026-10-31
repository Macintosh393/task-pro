import {
  createRouter,
  createRoute,
  redirect,
} from '@tanstack/react-router';
import { rootRoute, type RouterContext } from '../routes/__root';
import { LoginPage } from '../routes/login';
import { HomePage } from '../routes/_authenticated/home';
import { AuthenticatedLayout } from '../routes/_authenticated';

// 1. Index redirect
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: ({ context }) => {
    throw redirect({
      to: context.auth.isAuthenticated ? '/home' : '/login',
    });
  },
});

// 2. Public Login Route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
});

// 3. Authenticated Layout Guard
const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_authenticated',
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AuthenticatedLayout,
});

// 4. Protected Home Route
const homeRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/home',
  component: HomePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  authenticatedRoute.addChildren([homeRoute]),
]);

export const router = createRouter({
  routeTree,
  context: {
    queryClient: undefined!,
    auth: undefined!,
  },
});

export type { RouterContext };

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
