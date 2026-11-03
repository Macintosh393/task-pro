import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { WorkspaceView } from './WorkspaceView';

const meta = {
  title: 'Workspace/AppShell',
  component: WorkspaceView,
  parameters: { layout: 'fullscreen' },
  args: {
    user: { username: 'Workspace user', email: 'workspace@example.test' },
    boards: [],
    onLogout: () => {},
    onSelectBoard: () => {},
  },
} satisfies Meta<typeof WorkspaceView>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};

function SelectableBoards() {
  const [activeBoardId, setActiveBoardId] = useState('office');
  return (
    <WorkspaceView
      user={{ username: 'Workspace user', email: 'workspace@example.test' }}
      boards={[
        { id: 'office', title: 'Project office' },
        { id: 'neon', title: 'Neon Light Project' },
      ]}
      activeBoardId={activeBoardId}
      onSelectBoard={setActiveBoardId}
      onLogout={() => {}}
    />
  );
}

export const BoardSelection: Story = {
  render: () => <SelectableBoards />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const menu = canvasElement.querySelector<HTMLButtonElement>('.workspace-menu')!;
    if (!menu.hidden) await userEvent.click(menu);
    await userEvent.click(canvas.getByRole('button', { name: /^Neon Light Project$/ }));
    await waitFor(() =>
      expect(canvas.getByRole('heading', { name: /^Neon Light Project$/ })).toBeVisible(),
    );
    await waitFor(() => expect(canvas.getByRole('dialog', { hidden: true })).not.toBeVisible());
    if (!menu.hidden) await expect(menu).toHaveFocus();
  },
};
