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
          'Native button; type defaults to button. Loading preserves its label and blocks activation. Choose submit explicitly in forms. Colors use shared semantic tokens. Neutral stays black in every theme; large has a 56px minimum height. Icons are independent of the variant.',
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
      options: ['primary', 'secondary', 'destructive', 'ghost', 'neutral'],
      description: 'Intent, not a theme name.',
    },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
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

export const Neutral: Story = {
  args: { variant: 'neutral', size: 'large', children: 'Registration', fullWidth: true },
  decorators: [
    (Story) => (
      <div style={{ width: 344, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
};

export const AddAnotherColumn: Story = {
  args: {
    variant: 'neutral',
    size: 'large',
    children: 'Add another column',
    leadingIcon: 'boxed-plus',
    fullWidth: true,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 334, maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/t0eIVx06rFihnswWhS8Q2V/?node-id=1058-2271',
    },
    docs: {
      description: {
        story:
          '334×56 specimen with the existing 28px boxed-plus and 8px gap. Neutral uses #161616 for both this action and Registration; the column source uses #121212. Registration also uses 56px instead of its source 49px.',
      },
    },
  },
};

export const NeutralDisabled: Story = {
  ...AddAnotherColumn,
  args: { ...AddAnotherColumn.args, disabled: true },
  play: async ({ canvasElement, args }) => {
    canvasElement.querySelector('button')!.click();
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const NeutralLoading: Story = {
  ...AddAnotherColumn,
  args: { ...AddAnotherColumn.args, loading: true },
  play: async ({ canvasElement, args }) => {
    canvasElement.querySelector('button')!.click();
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
