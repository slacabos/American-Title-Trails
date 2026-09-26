import type { Meta, StoryObj } from "@storybook/react-vite";
import GameSetup from "./GameSetup";
import { PLAYER_COLORS } from "@/constants/colors";

const meta: Meta<typeof GameSetup> = {
  title: "Game/GameSetup",
  component: GameSetup,
  decorators: [
    (Story) => (
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 max-w-4xl w-full">
        <Story />
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

export const WithSavedGame: Story = {
  args: {
    onStartGame: () => undefined,
    onResumeGame: () => undefined,
    onDiscardSave: () => undefined,
    savedGame: {
      version: 1,
      savedAt: "2026-09-26T19:42:00.000Z",
      seed: 17,
      players: [
        { id: "player-1", name: "You", isAI: false, color: PLAYER_COLORS[0] },
        { id: "player-2", name: "Computer 2", isAI: true, aiDifficulty: "medium", color: PLAYER_COLORS[1] },
        { id: "player-3", name: "Computer 3", isAI: true, aiDifficulty: "hard", color: PLAYER_COLORS[2] },
      ],
      actions: [],
      log: [],
      turnNumber: 23,
    },
  },
};
