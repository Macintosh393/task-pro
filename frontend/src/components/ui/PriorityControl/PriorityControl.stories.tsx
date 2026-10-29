import { useArgs } from 'storybook/preview-api';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent } from 'storybook/test';
import { PriorityControl, type Priority } from './PriorityControl';
const meta = {
  title: 'UI/PriorityControl',
  component: PriorityControl,
  tags: ['autodocs'],
  args: { value: 'low', onChange: fn(), disabled: false },
  argTypes: {
    value: { control: 'select', options: ['none', 'low', 'medium', 'high'] },
    label: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  render: function Controlled(args) {
    const [, updateArgs] = useArgs();
    return (
      <PriorityControl
        {...args}
        onChange={(value: Priority) => {
          args.onChange(value);
          updateArgs({ value });
        }}
      />
    );
  },
} satisfies Meta<typeof PriorityControl>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const Selection: Story = {
  play: async ({ canvasElement, args }) => {
    const radio = canvasElement.querySelector<HTMLInputElement>('input[value="medium"]')!;
    await userEvent.click(radio);
    await expect(radio).toBeChecked();
    await expect(args.onChange).toHaveBeenCalledWith('medium');
  },
};
