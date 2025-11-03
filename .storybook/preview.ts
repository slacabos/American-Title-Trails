import type { Preview } from '@storybook/react-vite'
import '../src/index.css'

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
        colorPrimary: '#4169E1',
        colorSecondary: '#8B4513',
        
        // UI
        appBg: '#f9fafb',
        appContentBg: '#ffffff',
        appBorderColor: '#e5e7eb',
        
        // Text colors
        textColor: '#1f2937',
        textInverseColor: '#ffffff',
        
        // Toolbar default and active colors
        barTextColor: '#6b7280',
        barSelectedColor: '#4169E1',
        barBg: '#ffffff',
        
        // Form colors
        inputBg: '#ffffff',
        inputBorder: '#d1d5db',
        inputTextColor: '#1f2937',
      },
    },
  },
};

export default preview;