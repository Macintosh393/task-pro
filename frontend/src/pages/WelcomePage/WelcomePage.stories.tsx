import type { Meta, StoryObj } from '@storybook/react-vite';
import { WelcomePage } from './WelcomePage';

const meta = {
  title: 'Pages/Welcome',
  component: WelcomePage,
  parameters: {
    layout: 'fullscreen',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/t0eIVx06rFihnswWhS8Q2V/?node-id=1058-3425',
    },
  },
} satisfies Meta<typeof WelcomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
