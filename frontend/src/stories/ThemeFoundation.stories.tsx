import type { Meta, StoryObj } from '@storybook/react-vite';
import source from '../styles/themes.css?raw';
import { Heading, Text } from '../components/ui';
const tokens = [...new Set([...source.matchAll(/(--[a-z-]+):/g)].map((match) => match[1]))].filter(
  (token) => !['--focus-ring-width', '--focus-ring-offset', '--shadow-filters'].includes(token),
);
function ThemeFoundation() {
  return (
    <main className="mx-auto grid max-w-5xl gap-6">
      <Heading level={1}>Theme tokens</Heading>
      <Text>
        Semantic colors shared by the application and Storybook. Switch Dark / Light / Violet in the
        toolbar.
      </Text>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tokens.map((token) => (
          <li key={token} className="flex min-w-0 items-center gap-3 text-xs">
            <span
              aria-hidden="true"
              className="size-10 shrink-0 rounded-md border border-control-border"
              style={{ background: `var(${token})` }}
            />
            <code className="wrap-anywhere">{token}</code>
          </li>
        ))}
      </ul>
    </main>
  );
}
const meta = { title: 'Foundation/Theme tokens', component: ThemeFoundation } satisfies Meta<
  typeof ThemeFoundation
>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};
