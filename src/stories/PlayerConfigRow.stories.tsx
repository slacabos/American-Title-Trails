import type { Meta, StoryObj } from "@storybook/react";
import PlayerConfigRow from "../components/PlayerConfigRow";
import { PLAYER_COLORS } from "@/constants/colors";

const meta: Meta<typeof PlayerConfigRow> = {
  title: "Game/PlayerConfigRow",
  component: PlayerConfigRow,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen w-full bg-background p-8 flex items-center justify-center">
        <div className="max-w-lg w-full">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof PlayerConfigRow>;

export const Human: Story = {
  args: {
    config: {
      name: "You",
      id: "player-1",
      isAI: false,
      color: PLAYER_COLORS[0],
    },
    index: 0,
    onUpdate: () => undefined,
  },
};

export const AI: Story = {
  args: {
    config: {
      name: "AI Player 2",
      id: "player-2",
      isAI: true,
      aiDifficulty: "medium",
      color: PLAYER_COLORS[1],
    },
    index: 1,
    onUpdate: () => undefined,
  },
};
