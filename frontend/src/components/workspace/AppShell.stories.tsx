import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkspaceView } from './WorkspaceView';
import type { WorkspaceViewProps } from './workspace-types';

/** Story-only selection state: the real view is controlled through `activeBoardId`. */
function SelectableView(props: WorkspaceViewProps) {
  const [activeId, setActiveId] = useState(props.activeBoardId ?? null);
  return (
    <WorkspaceView
      {...props}
      activeBoardId={activeId}
      onSelectBoard={(board) => {
        props.onSelectBoard?.(board);
        setActiveId(board.id);
      }}
    />
  );
}

const meta = {
  title: 'Workspace/AppShell',
  component: WorkspaceView,
  parameters: { layout: 'fullscreen' },
  render: (args) => <SelectableView {...args} />,
  args: {
    user: { username: 'Workspace user', email: 'workspace@example.test' },
  },
} satisfies Meta<typeof WorkspaceView>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Filled: Story = {
  args: {
    activeBoardId: 'office',
    boards: [
      { id: 'office', title: 'Project office', icon: 'project' },
      { id: 'neon', title: 'Neon Light Project', icon: 'puzzle' },
    ],
  },
};
export const WithBackground: Story = {
  args: {
    ...Filled.args,
    activeBoard: { status: 'ready', board: { title: 'Project office', background: 'bg-05' } },
  },
};
export const BoardNotFound: Story = {
  args: {
    ...Filled.args,
    activeBoardId: null,
    activeBoard: { status: 'not-found', onBack: () => {} },
  },
};
