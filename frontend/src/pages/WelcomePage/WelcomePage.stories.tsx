import { useState } from 'react';
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import type { Decorator, Meta, StoryObj } from '@storybook/react-vite';
import { WelcomePage } from './WelcomePage';

function WelcomeStoryRouter({ Story }: { Story: Parameters<Decorator>[0] }) {
  const [router] = useState(() => {
    const rootRoute = createRootRoute();
    const welcome = createRoute({ getParentRoute: () => rootRoute, path: '/', component: Story });
    const login = createRoute({
      getParentRoute: () => rootRoute,
      path: '/login',
      component: () => <main aria-label="Login route">Login route</main>,
    });
    const register = createRoute({
      getParentRoute: () => rootRoute,
      path: '/register',
      component: () => <main aria-label="Registration route">Registration route</main>,
    });
    return createRouter({
      routeTree: rootRoute.addChildren([welcome, login, register]),
      history: createMemoryHistory({ initialEntries: ['/'] }),
    });
  });
  return <RouterProvider router={router} />;
}

const meta = {
  title: 'Pages/Welcome',
  component: WelcomePage,
  decorators: [(Story) => <WelcomeStoryRouter Story={Story} />],
  parameters: {
    layout: 'fullscreen',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/t0eIVx06rFihnswWhS8Q2V/?node-id=1058-3425',
    },
  },
} satisfies Meta<typeof WelcomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
