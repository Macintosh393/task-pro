import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon, type IconName } from './Icon';
import { sourceIcons } from './icon-data';
const iconNames = [...Object.keys(sourceIcons), 'close'] as IconName[];
const meta = {
  title: 'UI/Icon',
  component: Icon,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Local TaskPro SVG assets preserve their source theme colors. The close icon inherits currentColor. A label gives a standalone icon an accessible name; without it the icon is decorative.',
      },
    },
  },
  args: { name: 'plus', size: 20 },
  argTypes: {
    name: { control: 'select', options: iconNames },
    size: { control: 'select', options: [10, 16, 18, 20, 24, 28, 32, 68] },
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
      {([10, 16, 18, 20, 24, 28, 32, 68] as const).map((size) => (
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
