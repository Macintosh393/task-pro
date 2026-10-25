import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text, Heading } from './Typography';
const meta = {
  title: 'UI/Text',
  component: Text,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Local Poppins 400. Small is 12/16, medium 14/21. Muted uses an adapted readable text token, not the source low-opacity caption.',
      },
    },
  },
  args: {
    children: 'A shared foundation for the next screen.',
    size: 'medium',
    tone: 'primary',
    as: 'p',
  },
  argTypes: {
    size: { control: 'select', options: ['small', 'medium'] },
    tone: { control: 'select', options: ['primary', 'muted'] },
    as: { control: 'select', options: ['p', 'span'] },
  },
} satisfies Meta<typeof Text>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Body: Story = {};
export const Small: Story = { args: { size: 'small' } };
export const Muted: Story = { args: { tone: 'muted' } };
export const TypeSet: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 16 }}>
      <Heading level={1} size="large">
        Shared UI foundations
      </Heading>
      <Heading>Dialog heading</Heading>
      <Heading level={3} size="small">
        Section heading
      </Heading>
      <Text>Body text for a form or explanation.</Text>
      <Text size="small" tone="muted">
        Supporting text stays readable.
      </Text>
    </div>
  ),
};
