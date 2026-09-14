import type { Meta, StoryObj } from "@storybook/react-vite";
import { BoardScene } from "./BoardScene";
import { Game } from "@/game";
import { Board } from "@/board";
import { buildDeck, getStartTile } from "@/tileLibrary";
import { GamePhase, GameState } from "@/types";
import { positionKey } from "@/rendering/tileLayout";

function populatedState(count: number): GameState {
  const game = new Game(
    [
      { id: "blue", name: "Blue", color: "#457da1", isAI: true },
      { id: "red", name: "Red", color: "#cc5d44", isAI: true },
    ],
    { seed: 71 },
  );
  for (
    let step = 0;
    step < 500 &&
    game.getState().board.getAllTiles().size < count &&
    !game.getState().isGameOver;
    step++
  )
    game.processAITurn();
  return {
    ...game.getState(),
    phase: GamePhase.GAME_OVER,
    isGameOver: true,
    currentTile: undefined,
  };
}
const meta: Meta<typeof BoardScene> = {
  title: "Game/3D Tabletop",
  component: BoardScene,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ height: "85vh", minHeight: 600 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    onTilePlace: () => {},
    onUnavailable: () => {},
    state: populatedState(24),
  },
};
export default meta;
type Story = StoryObj<typeof meta>;
export const ConnectedScenery: Story = {};
export const FullDeck: Story = { args: { state: populatedState(52) } };

const gallery = new Board();
const unique = [
  ...new Map(
    [getStartTile(), ...buildDeck()].map((tile) => [tile.id, tile]),
  ).values(),
];
unique.forEach((tile, index) => {
  for (let rotation = 0; rotation < 4; rotation++) {
    const cell = index * 4 + rotation;
    const position = { x: (cell % 8) * 1.3, y: Math.floor(cell / 8) * 1.3 };
    gallery.tiles.set(positionKey(position), {
      tile: tile.rotate(rotation),
      position,
    });
  }
});
export const AllTilesAndRotations: Story = {
  args: {
    state: {
      ...populatedState(1),
      board: gallery,
      lastPlacedPosition: undefined,
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          "All 16 tile types in library order. Each group of four shows 0°, 90°, 180°, and 270° clockwise rotations. The entire gallery shares one WebGL canvas.",
      },
    },
  },
};
