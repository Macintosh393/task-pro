import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { AvatarUpload } from './AvatarUpload';
const meta = {
  title: 'UI/AvatarUpload',
  component: AvatarUpload,
  tags: ['autodocs'],
  args: { name: 'Your profile', onFileSelect: fn(), disabled: false, uploadLabel: 'Upload avatar' },
  argTypes: {
    name: { control: 'text' },
    src: { control: 'text' },
    disabled: { control: 'boolean' },
    uploadLabel: { control: 'text' },
  },
  parameters: { layout: 'centered' },
} satisfies Meta<typeof AvatarUpload>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const SelectFile: Story = {
  play: async ({ canvasElement, args }) => {
    const input = canvasElement.querySelector('input')!;
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    await userEvent.upload(input, file);
    await expect(args.onFileSelect).toHaveBeenCalledWith(file);
    await expect(input.value).toBe('');
    await userEvent.upload(input, file);
    await expect(args.onFileSelect).toHaveBeenCalledTimes(2);
  },
};
