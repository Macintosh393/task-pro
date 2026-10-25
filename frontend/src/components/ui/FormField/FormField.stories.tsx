import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormField } from './FormField';
import { Input } from '../Input';
const meta = {
  title: 'UI/FormField',
  component: FormField,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Wrap exactly one Input or Textarea. Generated id links the label and both help/error messages. Explicit id belongs on FormField. External aria-describedby is merged.',
      },
    },
  },
  args: { label: 'Title', help: 'Short supporting text.', children: <Input /> },
  argTypes: {
    children: { control: false },
    label: { control: 'text' },
    help: { control: 'text' },
    error: { control: 'text' },
  },
} satisfies Meta<typeof FormField>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Error: Story = { args: { error: 'Enter a title.' } };
