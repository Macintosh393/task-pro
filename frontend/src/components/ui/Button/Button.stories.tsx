import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { Button } from './Button';
const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Native button; type defaults to button. Loading preserves its label and blocks activation. Choose submit explicitly in forms. Colors use shared semantic tokens.',
      },
    },
  },
  args: {
    children: 'Save changes',
    variant: 'primary',
    size: 'medium',
    disabled: false,
    loading: false,
    onClick: fn(),
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'destructive', 'ghost'],
      description: 'Intent, not a theme name.',
    },
    size: { control: 'select', options: ['small', 'medium'] },
    loading: {
      control: 'boolean',
      description: 'Disables native activation and exposes aria-busy.',
    },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Destructive: Story = { args: { variant: 'destructive', children: 'Delete' } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true } };
export const Focus: Story = {
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector('button')!;
    button.focus();
    await expect(button).toHaveFocus();
  },
};
export const Activation: Story = {
  play: async ({ canvasElement, args }) => {
    const button = canvasElement.querySelector('button')!;
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
    await expect(button.type).toBe('button');
  },
};
export const LoadingGuard: Story = {
  args: { loading: true },
  play: async ({ canvasElement, args }) => {
    canvasElement.querySelector('button')!.click();
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Ghost: Story = { args: { variant: 'ghost' } };
export const Create: Story = {
  args: { children: 'Create', leadingIcon: 'boxed-plus', fullWidth: true },
  decorators: [
    (Story) => (
      <div style={{ width: 302, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
};

export const Small: Story = { args: { size: 'small' } };
