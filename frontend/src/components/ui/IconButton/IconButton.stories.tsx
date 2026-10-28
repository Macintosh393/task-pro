import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from './IconButton';
import { sourceIcons } from '../Icon/icon-data';
const meta = {
  title: 'UI/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Requires aria-label; decorative SVG inherits currentColor. Hit target is at least 44px.',
      },
    },
  },
  args: {
    icon: 'plus',
    'aria-label': 'Add item',
    variant: 'primary',
    size: 'medium',
    loading: false,
    disabled: false,
  },
  argTypes: {
    icon: {
      control: 'select',
      options: [
        'plus',
        'close',
        'trash',
        ...Object.keys(sourceIcons).filter(
          (name) => !['logo', 'avatar', 'boxed-plus'].includes(name),
        ),
      ],
    },
    variant: { control: 'select', options: ['primary', 'secondary', 'destructive', 'ghost'] },
    size: { control: 'select', options: ['small', 'medium'] },
    iconSize: { control: 'select', options: [16, 18, 20, 24, 32] },
    treatment: { control: 'select', options: ['standard', 'compact-add'] },
  },
} satisfies Meta<typeof IconButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Add: Story = {};
export const Destructive: Story = {
  args: { icon: 'trash', variant: 'destructive', 'aria-label': 'Delete item' },
};
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true } };

export const Ghost: Story = { args: { variant: 'ghost' } };
export const CompactAdd: Story = { args: { treatment: 'compact-add' } };
export const Edit: Story = {
  args: { icon: 'edit', iconSize: 16, variant: 'ghost', 'aria-label': 'Edit item' },
};
