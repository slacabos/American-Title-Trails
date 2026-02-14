import type { Meta, StoryObj } from "@storybook/react-vite";
import GameSetup from "./GameSetup";

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
