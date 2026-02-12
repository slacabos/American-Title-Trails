import type { Meta, StoryObj } from "@storybook/react";
import GameSetupSidebar from "../components/GameSetupSidebar";

const meta: Meta<typeof GameSetupSidebar> = {
  title: "Game/GameSetupSidebar",
  component: GameSetupSidebar,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen w-full bg-background p-8 flex items-center justify-center">
        <div className="w-[300px]">
          <Story />
        </div>
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
