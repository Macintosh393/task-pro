import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from './IconButton';
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
    icon: { control: 'select', options: ['plus', 'close', 'trash'] },
    variant: { control: 'select', options: ['primary', 'secondary', 'destructive'] },
    size: { control: 'select', options: ['small', 'medium'] },
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
