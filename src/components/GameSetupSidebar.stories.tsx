import type { Meta, StoryObj } from "@storybook/react-vite";
import GameSetupSidebar from "./GameSetupSidebar";

const meta: Meta<typeof GameSetupSidebar> = {
  title: "Game/GameSetupSidebar",
  component: GameSetupSidebar,
  decorators: [
    (Story) => (
      <div className="w-[300px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof GameSetupSidebar>;

export const Default: Story = {
  args: {
    onShowHelp: () => undefined,
  },
};
