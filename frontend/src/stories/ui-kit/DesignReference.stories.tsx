import plant from '../../assets/figma/img2.png';
import { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Avatar,
  AvatarUpload,
  BoardIconPicker,
  Button,
  FormField,
  Heading,
  IconButton,
  Input,
  Logo,
  LogoutButton,
  PriorityControl,
  type BoardIcon,
  type Priority,
} from '../../components/ui';

const meta = { title: 'UI/Design reference', parameters: { layout: 'padded' } } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function AvatarDemo({ disabled = false }: { disabled?: boolean }) {
  const [preview, setPreview] = useState<{ name: string; src: string }>();
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.src);
    };
  }, [preview]);
  return (
    <div>
      <AvatarUpload
        name="Your profile"
        src={preview?.src}
        onFileSelect={(file) => setPreview({ name: file.name, src: URL.createObjectURL(file) })}
        disabled={disabled}
      />
      {preview && <p role="status">Selected: {preview.name}</p>}
    </div>
  );
}
function Choices({ disabled = false }: { disabled?: boolean }) {
  const [priority, setPriority] = useState<Priority>('low');
  const [icon, setIcon] = useState<BoardIcon>('project');
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <PriorityControl value={priority} onChange={setPriority} disabled={disabled} />
      <BoardIconPicker value={icon} onChange={setIcon} disabled={disabled} />
    </div>
  );
}
export const Kit: Story = {
  render: () => (
    <main className="mx-auto grid max-w-[900px] grid-cols-[minmax(0,1fr)] gap-7">
      <Heading level={1}>Task Pro UI kit</Heading>
      <div className="flex flex-wrap items-center gap-8 rounded-lg bg-surface-sidebar p-5">
        <Logo />
        <LogoutButton />
      </div>
      <section className="flex flex-wrap items-center gap-6" aria-label="Create controls">
        <IconButton icon="plus" treatment="compact-add" aria-label="Add board" />
        <div className="grid w-[302px] max-w-full gap-3.5">
          <Button leadingIcon="boxed-plus" fullWidth>
            Create
          </Button>
        </div>
        <div aria-hidden="true" className="relative h-[78px] w-[54px] shrink-0 overflow-hidden">
          <img
            src={plant}
            alt=""
            className="absolute -top-[10.81%] -left-[31.88%] h-[110.81%] w-[159.41%] max-w-none"
          />
        </div>
        <AvatarDemo />
      </section>
      <section className="flex flex-wrap items-center gap-6" aria-label="Fields and actions">
        <div className="grid w-[302px] max-w-full gap-3.5">
          <FormField label="Title">
            <Input placeholder="Title" />
          </FormField>
          <FormField label="Board title">
            <Input defaultValue="The Watch Spot Design" />
          </FormField>
        </div>
        <div>
          <IconButton icon="filter" iconSize={16} variant="ghost" aria-label="Filter tasks" />
          <IconButton
            icon="bell"
            iconSize={16}
            variant="ghost"
            aria-label="Task reminder"
            className="text-icon-action-active"
          />
          <IconButton icon="move" iconSize={16} variant="ghost" aria-label="Move task" />
          <IconButton icon="edit" iconSize={16} variant="ghost" aria-label="Edit task" />
          <IconButton icon="trash" iconSize={16} variant="ghost" aria-label="Delete task" />
        </div>
      </section>
      <Choices />
    </main>
  ),
};
export const SelectionControls: Story = { render: () => <Choices /> };
export const DisabledSelections: Story = { render: () => <Choices disabled /> };
export const UploadAvatar: Story = { render: () => <AvatarDemo /> };
export const DisabledUpload: Story = { render: () => <AvatarDemo disabled /> };
export const MissingAvatar: Story = {
  render: () => <Avatar name="Profile" src="data:image/png;base64,broken" />,
};
export const Branding: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-8 rounded-lg bg-surface-sidebar p-5">
      <Logo />
      <LogoutButton />
    </div>
  ),
};

export const Dark: Story = { ...Kit, globals: { theme: 'Dark' } };
export const Light: Story = { ...Kit, globals: { theme: 'Light' } };
export const Violet: Story = { ...Kit, globals: { theme: 'Violet' } };
export const Mobile: Story = {
  ...Kit,
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};
