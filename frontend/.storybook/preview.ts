import type { Preview } from '@storybook/react-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import '../src/index.css';
import { INITIAL_VIEWPORTS } from 'storybook/viewport';

const preview: Preview = {
  decorators: [
    withThemeByDataAttribute({
      themes: { Dark: 'dark', Light: 'light', Violet: 'violet' },
      defaultTheme: 'Dark',
      attributeName: 'data-theme',
      parentSelector: 'html',
    }),
  ],
  parameters: {
    layout: 'padded',
    a11y: { test: 'error' },
    viewport: { options: INITIAL_VIEWPORTS },
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/t0eIVx06rFihnswWhS8Q2V/?node-id=1058-10396',
    },
    options: { storySort: { order: ['Foundation', 'UI'] } },
  },
};

export default preview;
