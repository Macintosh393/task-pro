import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { WorkspaceView } from './WorkspaceView';
import type { WorkspaceActiveBoard, WorkspaceColumn, WorkspaceViewProps } from './workspace-types';

const columns: WorkspaceColumn[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'progress', title: 'In progress' },
  { id: 'done', title: 'Done' },
];

const officeBoard = (
  columnsState: Extract<WorkspaceActiveBoard, { status: 'ready' }>['columns'],
): WorkspaceActiveBoard => ({
  status: 'ready',
  board: { title: 'Project office', background: 'none' },
  columns: columnsState,
});

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
    activeBoard: {
      status: 'ready',
      board: { title: 'Project office', background: 'bg-05' },
      columns: { status: 'ready', columns },
    },
  },
};
export const NoColumns: Story = {
  args: { ...Filled.args, activeBoard: officeBoard({ status: 'ready', columns: [] }) },
};
export const WithColumns: Story = {
  args: { ...Filled.args, activeBoard: officeBoard({ status: 'ready', columns }) },
};
export const ManyColumnsLongNames: Story = {
  args: {
    ...Filled.args,
    activeBoard: officeBoard({
      status: 'ready',
      columns: [
        ...columns,
        { id: 'long', title: 'A column with a very long name that does not fit into its header' },
        { id: 'unbroken', title: 'Supercalifragilisticexpialidocious-column-title-without-spaces' },
        { id: 'review', title: 'Review' },
      ],
    }),
  },
};
export const ColumnsLoading: Story = {
  args: { ...Filled.args, activeBoard: officeBoard({ status: 'loading' }) },
};
export const ColumnsError: Story = {
  args: { ...Filled.args, activeBoard: officeBoard({ status: 'error', onRetry: () => {} }) },
};
export const BoardNotFound: Story = {
  args: {
    ...Filled.args,
    activeBoardId: null,
    activeBoard: { status: 'not-found', onBack: () => {} },
  },
};
