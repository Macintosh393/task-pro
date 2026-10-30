import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { LogoutButton } from './LogoutButton';
const meta = {
  title: 'UI/LogoutButton',
  component: LogoutButton,
  tags: ['autodocs'],
  args: { children: 'Log out', onClick: fn(), disabled: false, loading: false },
  argTypes: {
    children: { control: 'text' },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div className="rounded-lg bg-surface-sidebar p-5">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof LogoutButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true } };
export const Activation: Story = {
  play: async ({ canvasElement, args }) => {
    await userEvent.click(canvasElement.querySelector('button')!);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
