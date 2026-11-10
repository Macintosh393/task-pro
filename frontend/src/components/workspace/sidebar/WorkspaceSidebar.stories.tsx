import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { WorkspaceBoard, WorkspaceSidebarProps } from '../workspace-types';
import { WorkspaceSidebar } from './WorkspaceSidebar';

const noop = () => {};

const boards: WorkspaceBoard[] = [
  { id: 'office', title: 'Project office', icon: 'project' },
  { id: 'launch', title: 'Product launch', icon: 'star' },
  { id: 'research', title: 'Research notes', icon: 'puzzle' },
  { id: 'retro', title: 'Team retro', icon: 'loading' },
];

/** Story-only selection state: the real sidebar is controlled through `activeBoardId`. */
function SelectableSidebar(props: WorkspaceSidebarProps) {
  const [activeId, setActiveId] = useState(props.activeBoardId ?? null);
  return (
    <WorkspaceSidebar
      {...props}
      activeBoardId={activeId}
      onSelectBoard={(board) => {
        props.onSelectBoard(board);
        setActiveId(board.id);
      }}
    />
  );
}

const meta = {
  title: 'Workspace/Sidebar',
  component: WorkspaceSidebar,
  parameters: { layout: 'fullscreen' },
  render: (args) => <SelectableSidebar {...args} />,
  decorators: [
    (Story) => (
      <main className="h-[900px] w-[260px] bg-surface-sidebar text-sidebar">
        <h1 className="sr-only">Workspace sidebar</h1>
        <Story />
      </main>
    ),
  ],
  args: {
    boards: [],
    status: 'ready',
    activeBoardId: null,
    onCreateBoard: noop,
    onSelectBoard: noop,
    onEditBoard: noop,
    onDeleteBoard: noop,
    onRetryBoards: noop,
    onOpenHelp: noop,
    onLogout: noop,
  },
} satisfies Meta<typeof WorkspaceSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Loading: Story = { args: { status: 'loading' } };
export const ErrorState: Story = { name: 'Error', args: { status: 'error' } };
export const Filled: Story = { args: { boards } };
export const Active: Story = { args: { boards, activeBoardId: 'office' } };
export const LongNames: Story = {
  args: {
    activeBoardId: 'long-1',
    boards: [
      {
        id: 'long-1',
        title: 'An extremely long board title that never covers the row actions',
        icon: 'hexagon',
      },
      { id: 'long-2', title: 'Supercalifragilisticexpialidocious-planning', icon: 'lightning' },
      { id: 'long-3', title: 'Short', icon: 'container' },
    ],
  },
};
export const ManyBoards: Story = {
  args: {
    activeBoardId: 'many-3',
    boards: Array.from({ length: 24 }, (_, index) => ({
      id: `many-${index}`,
      title: `Board ${index + 1}`,
      icon: (['project', 'star', 'puzzle', 'loading', 'container', 'lightning'] as const)[
        index % 6
      ],
    })),
  },
};
