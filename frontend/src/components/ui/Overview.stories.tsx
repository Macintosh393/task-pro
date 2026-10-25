import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, FormField, Heading, IconButton, Input, Text, Textarea } from './index';
const meta = { title: 'UI/Overview', parameters: { layout: 'padded' } } satisfies Meta;
export default meta;
export const Overview: StoryObj = {
  render: () => (
    <main style={{ maxWidth: 720, margin: 'auto', display: 'grid', gap: 24 }}>
      <header>
        <Text size="small" tone="muted">
          TASK PRO / SHARED UI
        </Text>
        <Heading level={1} size="large">
          Small pieces, shared foundations
        </Heading>
      </header>
      <Text>Native controls, local Poppins, and the same semantic tokens in every theme.</Text>
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }} aria-label="Actions">
        <Button>Save changes</Button>
        <Button variant="secondary">Cancel</Button>
        <Button variant="destructive">Delete</Button>
        <IconButton icon="plus" aria-label="Add item" />
        <Button loading>Saving</Button>
        <Button disabled>Unavailable</Button>
      </section>
      <FormField label="Title" help="A descriptive name helps everyone understand it.">
        <Input placeholder="Enter a title" />
      </FormField>
      <FormField label="Description" error="Add a short explanation before continuing.">
        <Textarea placeholder="Write a description" />
      </FormField>
      <Text size="small" tone="muted">
        Use the toolbar to compare Dark, Light, and Violet. Interaction states are documented
        adaptations.
      </Text>
    </main>
  ),
};
