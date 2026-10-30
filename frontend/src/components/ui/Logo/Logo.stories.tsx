import type { Meta, StoryObj } from '@storybook/react-vite';
import { Logo } from './Logo';
const meta = {
  title: 'UI/Logo',
  component: Logo,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="rounded-lg bg-surface-sidebar p-5">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Logo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Dark: Story = { globals: { theme: 'Dark' } };
export const Light: Story = { globals: { theme: 'Light' } };
export const Violet: Story = { globals: { theme: 'Violet' } };
