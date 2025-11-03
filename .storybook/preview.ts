import type { Preview } from '@storybook/react-vite'
import '../src/index.css'
import theme from '../src/theme/colors'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo'
    },
    
    backgrounds: {
      default: 'neutral',
      values: [
        {
          name: 'neutral',
          value: '#f9fafb',
        },
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#1f2937',
        },
      ],
    },
    
    docs: {
      theme: {
        base: 'light',
        colorPrimary: theme.GAME.costco,
        colorSecondary: theme.GAME.road,

        // UI
        appBg: theme.UI.foreground,
        appContentBg: theme.UI.cardForeground,
        appBorderColor: theme.UI.border,

        // Text colors
        textColor: theme.UI.secondary,
        textInverseColor: theme.UI.foreground,

        // Toolbar default and active colors
        barTextColor: '#6b7280',
        barSelectedColor: theme.GAME.costco,
        barBg: theme.UI.cardForeground,

        // Form colors
        inputBg: theme.UI.cardForeground,
        inputBorder: theme.UI.border,
        inputTextColor: theme.UI.secondary,
      },
    },
  },
};

export default preview;