import type { Meta, StoryObj } from "@storybook/react";
import HelpModal from "../components/HelpModal";

const meta: Meta<typeof HelpModal> = {
  title: "Game/HelpModal",
  component: HelpModal,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof HelpModal>;

export const Open: Story = {
  args: {
    isOpen: true,
    onClose: () => undefined,
  },
};
