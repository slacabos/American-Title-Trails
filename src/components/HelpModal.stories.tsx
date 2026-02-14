import type { Meta, StoryObj } from "@storybook/react-vite";
import HelpModal from "./HelpModal";

const meta: Meta<typeof HelpModal> = {
  title: "Game/HelpModal",
  component: HelpModal,
};

export default meta;

type Story = StoryObj<typeof HelpModal>;

export const Open: Story = {
  args: {
    isOpen: true,
    onClose: () => undefined,
  },
};
