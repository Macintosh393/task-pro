import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './Avatar';
const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  args: { name: 'Your profile' },
  argTypes: { name: { control: 'text' }, src: { control: 'text' } },
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Placeholder: Story = {};
export const Image: Story = {
  args: {
    src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="68" height="68"%3E%3Crect width="68" height="68" fill="%238fa1d0"/%3E%3C/svg%3E',
  },
};
export const BrokenImage: Story = { args: { src: 'data:image/png;base64,broken' } };
