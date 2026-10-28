import type { Preview } from '@storybook/react-vite';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import '../src/index.css';

const preview: Preview = {
  decorators: [
    withThemeByDataAttribute({
      themes: { Dark: 'dark', Light: 'light', Violet: 'violet' },
      defaultTheme: 'Dark',
      attributeName: 'data-theme',
      parentSelector: 'html',
    }),
  ],
  parameters: { layout: 'fullscreen' },
};

export default preview;
