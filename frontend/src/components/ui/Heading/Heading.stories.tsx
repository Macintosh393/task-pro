import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading } from './Heading';
const meta = {
  title: 'UI/Heading',
  component: Heading,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Semantic level is independent of visual size. Source dialog heading: 18px/500, -0.36px tracking. Other sizes are kit adaptations.',
      },
    },
  },
  args: { children: 'A clear heading', level: 2, size: 'medium' },
  argTypes: {
    level: { control: 'select', options: [1, 2, 3, 4, 5, 6] },
    size: { control: 'select', options: ['small', 'medium', 'large'] },
  },
} satisfies Meta<typeof Heading>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Long: Story = {
  args: {
    children: 'A longer heading that wraps naturally on small screens without clipping its text',
  },
};
