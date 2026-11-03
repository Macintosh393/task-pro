import { createRouter, createRoute, redirect } from '@tanstack/react-router';
import { rootRoute, type RouterContext } from '../routes/__root';
import { AUTH_QUERY_KEY } from '../features/auth/context/auth-context-definition';
import { WelcomePage } from '../pages/WelcomePage';
import { RegisterPage } from '../pages/RegisterPage';
import { LoginPage } from '../routes/login';
import { HomePage } from '../routes/_authenticated/home';
import { AuthenticatedLayout } from '../routes/_authenticated';

function hasAuthenticatedUser(context: RouterContext): boolean {
  const user = context.queryClient.getQueryData(AUTH_QUERY_KEY);
  const queryState = context.queryClient.getQueryState(AUTH_QUERY_KEY);

  return Boolean(user) && queryState?.status === 'success';
}

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: WelcomePage,
  beforeLoad: ({ context }) => {
    if (hasAuthenticatedUser(context)) {
      throw redirect({ to: '/home' });
    }
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/register',
  component: RegisterPage,
});

const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: '_authenticated',
  beforeLoad: ({ context, location }) => {
    if (!hasAuthenticatedUser(context)) {
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

const homeRoute = createRoute({
  getParentRoute: () => authenticatedRoute,
  path: '/home',
  component: HomePage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  authenticatedRoute.addChildren([homeRoute]),
]);

export const router = createRouter({
  routeTree,
  context: {
    queryClient: undefined!,
  },
});

export type { RouterContext };

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
