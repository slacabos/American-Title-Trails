import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import GameBoard from "./GameBoard";

const meta: Meta<typeof GameBoard> = {
  title: "Game/Playable Board",
  component: GameBoard,
  parameters: { layout: "fullscreen" },
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

function withView(view: "tabletop" | "drone") {
  return () => {
    const key = "american-tile-trails.view";
    const previous = localStorage.getItem(key);
    localStorage.setItem(key, view);
    return () => {
      if (previous === null) localStorage.removeItem(key);
      else localStorage.setItem(key, previous);
    };
  };
}

export const SceneryGame: Story = {
  beforeEach: withView("tabletop"),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByTestId("board-3d");
    await userEvent.click(canvas.getByTitle("Rotate clockwise (E)"));
    await userEvent.click(canvas.getByTitle("Rotate counter-clockwise (Q)"));
    await userEvent.keyboard("e");
    await userEvent.keyboard("q");
    await userEvent.click(canvas.getByRole("button", { name: "Drone" }));
    await expect(canvas.getByRole("button", { name: "Drone" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(canvas.getByRole("button", { name: "Tabletop" }));
    await canvas.findByTestId("board-3d");
    await userEvent.keyboard("?");
    const document = within(canvasElement.ownerDocument.body);
    await document.findByRole("dialog");
    await userEvent.click(document.getByRole("button", { name: "Got it!" }));
  },
};
export const DroneGame: Story = { beforeEach: withView("drone") };
