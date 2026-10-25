import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon, type IconName } from './Icon';
import { sourceIcons } from './icon-data';
const iconNames = [...Object.keys(sourceIcons), 'plus', 'close', 'trash'] as IconName[];
const meta = {
  title: 'UI/Icon',
  component: Icon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Sourced TaskPro SVG geometries. Color inherits from its semantic parent; label makes a standalone icon meaningful. Without label it is decorative.',
      },
    },
  },
  args: { name: 'plus', size: 20 },
  argTypes: {
    name: { control: 'select', options: iconNames },
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

export const Inventory: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
      {iconNames
        .filter((name) => !['logo', 'avatar', 'boxed-plus'].includes(name))
        .map((name) => (
          <div key={name} style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
            <Icon name={name} size={name === 'logout' ? 32 : 18} />
            <span>{name}</span>
          </div>
        ))}
    </div>
  ),
};
