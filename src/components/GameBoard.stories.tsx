import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import GameBoard from "./GameBoard";

const meta: Meta<typeof GameBoard> = {
  title: "Game/Playable Board",
  component: GameBoard,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="game-layout">
        <Story />
      </div>
    ),
  ],
  args: {
    players: [
      { id: "blue", name: "Blue", color: "#457da1" },
      { id: "red", name: "Red", color: "#cc5d44" },
    ],
    onReset: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

function withView(mode: "3d" | "2d") {
  return () => {
    const key = "american-tile-trails.renderer";
    const previous = localStorage.getItem(key);
    localStorage.setItem(key, mode);
    return () => {
      if (previous === null) localStorage.removeItem(key);
      else localStorage.setItem(key, previous);
    };
  };
}

export const SceneryGame: Story = {
  beforeEach: withView("3d"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByTestId("board-3d");
    await userEvent.click(canvas.getByTitle("Rotate Clockwise"));
    await userEvent.click(canvas.getByTitle("Rotate Counter-Clockwise"));
    await userEvent.keyboard("r");
    await userEvent.keyboard("{Shift>}r{/Shift}");
    await userEvent.click(canvas.getByRole("button", { name: "2D classic" }));
    await expect(
      canvasElement.querySelector(".board-canvas-container"),
    ).not.toBeNull();
    await userEvent.click(canvas.getByRole("button", { name: "3D scenery" }));
    await canvas.findByTestId("board-3d");
    await userEvent.keyboard("?");
    const document = within(canvasElement.ownerDocument.body);
    await document.findByRole("dialog");
    await userEvent.click(document.getByRole("button", { name: "Got it!" }));
  },
};
export const ClassicGame: Story = { beforeEach: withView("2d") };
