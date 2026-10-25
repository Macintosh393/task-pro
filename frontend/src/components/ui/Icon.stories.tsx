import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from './Icon';
const meta = {
  title: 'UI/Icon',
  component: Icon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Three sourced SVG geometries. Color inherits from its semantic parent; label makes a standalone icon meaningful. Without label it is decorative.',
      },
    },
  },
  args: { name: 'plus', size: 20 },
  argTypes: {
    name: { control: 'select', options: ['plus', 'close', 'trash'] },
    size: { control: 'select', options: [16, 18, 20, 24] },
    label: { control: 'text' },
  },
} satisfies Meta<typeof Icon>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Decorative: Story = {};
export const Meaningful: Story = { args: { name: 'trash', label: 'Delete' } };
export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16 }}>
      {([16, 18, 20, 24] as const).map((size) => (
        <Icon key={size} name="plus" size={size} label={`${size} pixel plus`} />
      ))}
    </div>
  ),
};
