import type { Meta, StoryObj } from '@storybook/react-vite';
import './theme-foundation.css';

// One technical specimen, not a product card or a UI-kit component.
function ThemeFoundation() {
  const roles = ['canvas', 'sidebar', 'header', 'card', 'column-heading', 'filters'];
  const priorities = ['low', 'medium', 'high', 'none'];
  return (
    <main className="theme-foundation">
      <h1>Theme foundation</h1>
      <p>Use the Dark / Light / Violet toolbar. These are shared application tokens.</p>
      <section className="theme-foundation__card" aria-label="Token specimen">
        <h2>Semantic surfaces</h2>
        <ul className="theme-foundation__swatches">
          {roles.map((role) => (
            <li key={role}>
              <span
                className="theme-foundation__swatch"
                style={{ background: `var(--surface-${role})` }}
              />
              <code>--surface-{role}</code>
            </li>
          ))}
        </ul>
        <p className="theme-foundation__description">
          Description text uses its source-specific alpha.
        </p>
        <p className="theme-foundation__caption">
          Caption alpha is a source specimen, not a contrast guarantee.
        </p>
        <p className="theme-foundation__accent">Primary action color and foreground specimen</p>
        <ul className="theme-foundation__swatches">
          {priorities.map((priority) => (
            <li key={priority}>
              <span
                className="theme-foundation__swatch"
                style={{ background: `var(--priority-${priority})` }}
              />
              <span>Priority: {priority}</span>
            </li>
          ))}
        </ul>
        <a href="#token-notes">Keyboard focus specimen (derived)</a>
      </section>
      <p id="token-notes">
        Technical layout and system font; no Figma layout or typography fidelity claim. See
        docs/themes.md.
      </p>
    </main>
  );
}

const meta = {
  title: 'Foundation/Theme tokens',
  component: ThemeFoundation,
} satisfies Meta<typeof ThemeFoundation>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};
