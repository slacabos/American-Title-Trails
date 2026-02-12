import type { Meta, StoryObj } from "@storybook/react";
import GameSetup from "../components/GameSetup";

const meta: Meta<typeof GameSetup> = {
  title: "Game/GameSetup",
  component: GameSetup,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen w-full bg-background p-8 flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 max-w-4xl w-full">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof GameSetup>;

export const Default: Story = {
  args: {
    onStartGame: () => undefined,
  },
};
