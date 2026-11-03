import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkspaceView } from './WorkspaceView';

const meta = {
  title: 'Workspace/AppShell',
  component: WorkspaceView,
  parameters: { layout: 'fullscreen' },
  args: {
    user: { username: 'Workspace user', email: 'workspace@example.test' },
  },
} satisfies Meta<typeof WorkspaceView>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
