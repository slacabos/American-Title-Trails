import React from "react";
import type { Preview } from "@storybook/react-vite";
import "../src/index.css";

const preview: Preview = {
  decorators: [
    (Story) => {
      if (typeof document !== "undefined") {
        document.documentElement.classList.add("dark");
      }
      return React.createElement(Story);
    },
  ],
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
      test: "todo",
    },
  },
};

export default preview;
