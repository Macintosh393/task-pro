import { useArgs } from 'storybook/preview-api';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { BoardIconPicker, type BoardIcon } from './BoardIconPicker';
const meta = {
  title: 'UI/BoardIconPicker',
  component: BoardIconPicker,
  tags: ['autodocs'],
  args: { value: 'project', onChange: fn(), disabled: false },
  argTypes: {
    value: {
      control: 'select',
      options: [
        'project',
        'star',
        'loading',
        'puzzle',
        'container',
        'lightning',
        'colors',
        'hexagon',
      ],
    },
    label: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  render: function Controlled(args) {
    const [, updateArgs] = useArgs();
    return (
      <BoardIconPicker
        {...args}
        onChange={(value: BoardIcon) => {
          args.onChange(value);
          updateArgs({ value });
        }}
      />
    );
  },
} satisfies Meta<typeof BoardIconPicker>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const Selection: Story = {
  play: async ({ canvasElement, args }) => {
    const radio = canvasElement.querySelector<HTMLInputElement>('input[value="star"]')!;
    await userEvent.click(radio);
    await expect(radio).toBeChecked();
    await expect(args.onChange).toHaveBeenCalledWith('star');
  },
};
