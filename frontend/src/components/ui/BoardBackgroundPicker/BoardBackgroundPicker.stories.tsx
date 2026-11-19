import { useArgs } from 'storybook/preview-api';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { BoardBackgroundPicker, type BoardBackground } from './BoardBackgroundPicker';
const meta = {
  title: 'UI/BoardBackgroundPicker',
  component: BoardBackgroundPicker,
  tags: ['autodocs'],
  args: { value: 'none', onChange: fn(), disabled: false },
  argTypes: {
    value: {
      control: 'select',
      options: [
        'none',
        'bg-01',
        'bg-02',
        'bg-03',
        'bg-04',
        'bg-05',
        'bg-06',
        'bg-07',
        'bg-08',
        'bg-09',
        'bg-10',
        'bg-11',
        'bg-12',
        'bg-13',
        'bg-14',
        'bg-15',
      ],
    },
    label: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  render: function Controlled(args) {
    const [, updateArgs] = useArgs();
    return (
      <BoardBackgroundPicker
        {...args}
        onChange={(value: BoardBackground) => {
          args.onChange(value);
          updateArgs({ value });
        }}
      />
    );
  },
} satisfies Meta<typeof BoardBackgroundPicker>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const Selection: Story = {
  play: async ({ canvasElement, args }) => {
    const radio = canvasElement.querySelector<HTMLInputElement>('input[value="bg-05"]')!;
    await userEvent.click(radio);
    await expect(radio).toBeChecked();
    await expect(args.onChange).toHaveBeenCalledWith('bg-05');
  },
};
