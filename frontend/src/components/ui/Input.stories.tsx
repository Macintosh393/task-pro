import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';
import { FormField } from './FormField';
const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Native props and refs. Compose with FormField for label/help/error. Controlled value/onChange stays with the consumer; no business validation.',
      },
    },
  },
  args: { placeholder: 'Enter text', disabled: false },
  argTypes: { disabled: { control: 'boolean' }, placeholder: { control: 'text' } },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420 }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <FormField label="Description" help="A short explanation.">
      <Input {...args} />
    </FormField>
  ),
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true, defaultValue: 'Preserved value' } };
export const Error: Story = {
  render: (args) => (
    <FormField
      label="A long label that should wrap naturally even on a narrow screen"
      help="Help remains associated with the field."
      error="Please review this value. This long error remains readable and associated with its control."
    >
      <Input {...args} />
    </FormField>
  ),
};
export const Focus: Story = {
  play: ({ canvasElement }) => {
    canvasElement.querySelector('input')?.focus();
  },
};
export const Controlled: Story = {
  render: function ControlledField(args) {
    const [value, setValue] = useState('');
    return (
      <FormField label="Description" help={`${value.length} characters`}>
        <Input {...args} value={value} onChange={(event) => setValue(event.target.value)} />
      </FormField>
    );
  },
};
