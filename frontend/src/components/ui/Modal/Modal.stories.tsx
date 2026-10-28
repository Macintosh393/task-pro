import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Modal } from './Modal';
import { Button } from '../Button';
import { FormField } from '../FormField';
import { Input } from '../Input';
import { Text } from '../Text';
const meta = {
  title: 'UI/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Controlled native dialog. Open via a trigger, then test Tab/Shift+Tab, Escape, close and focus return. Defaults focus to its heading; optional initialFocusRef. Backdrop does not dismiss. Parent owns open; avoid method=dialog forms and close via onClose/state.',
      },
    },
  },
  args: {
    open: false,
    onClose: () => {},
    title: 'Edit details',
    description: 'A reusable modal shell.',
    children: null,
  },
  argTypes: {
    open: { control: false },
    onClose: { control: false },
    children: { control: false },
    initialFocusRef: { control: false },
  },
  render: function Example(args) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        <Modal {...args} open={open} onClose={() => setOpen(false)}>
          <FormField label="Title">
            <Input />
          </FormField>
          <div style={{ marginTop: 16 }}>
            <Button onClick={() => setOpen(false)}>Done</Button>
          </div>
        </Modal>
      </>
    );
  },
} satisfies Meta<typeof Modal>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const InitialFieldFocus: Story = {
  render: function FieldFocus(args) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLInputElement>(null);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        <Modal {...args} open={open} onClose={() => setOpen(false)} initialFocusRef={ref}>
          <FormField label="Title">
            <Input ref={ref} />
          </FormField>
        </Modal>
      </>
    );
  },
};
export const LongContent: Story = {
  render: function LongDialog(args) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open dialog</Button>
        <Modal {...args} open={open} onClose={() => setOpen(false)}>
          {Array.from({ length: 20 }, (_, i) => (
            <Text key={i}>
              Long content {i + 1}: the dialog scrolls within the viewport and keeps the final
              action reachable.
            </Text>
          ))}
          <Button onClick={() => setOpen(false)}>Done</Button>
        </Modal>
      </>
    );
  },
};
