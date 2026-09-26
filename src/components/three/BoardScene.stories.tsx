import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { expect, waitFor, within } from "storybook/test";
import { BoardScene } from "./BoardScene";
import { Game } from "@/game";
import { Board } from "@/board";
import { buildDeck, getStartTile } from "@/tileLibrary";
import { buildRiverDeck, getRiverSource, getRiverLake } from "@/riverLibrary";
import { GamePhase, GameState } from "@/types";
import { positionKey } from "@/rendering/tileLayout";
import { warehouseExamples } from "@/test/fixtures/warehouseExamples";
import { completedCostcos } from "@/rendering/completedCostcos";
import { Tile } from "@/tile";

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
    step < 500 && game.getState().board.getAllTiles().size < count && !game.getState().isGameOver;
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

/** Two AI players keep placing tiles; each one drops in and settles. */
function LandingDemo() {
  const [game] = useState(
    () =>
      new Game(
        [
          { id: "blue", name: "Blue", color: "#457da1", isAI: true },
          { id: "red", name: "Red", color: "#cc5d44", isAI: true },
        ],
        { seed: 71 },
      ),
  );
  const [state, setState] = useState(() => game.getState());
  useEffect(() => {
    game.setStateChangeListener(setState);
    const timer = setInterval(() => {
      if (!game.getState().isGameOver) game.processAITurn();
    }, 350);
    return () => clearInterval(timer);
  }, [game]);
  return <BoardScene state={state} onTilePlace={() => {}} onUnavailable={() => {}} />;
}

export const TileLanding: Story = {
  render: () => <LandingDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await canvas.findByTestId("board-3d");
    // The river opening includes Costco tiles, whose warehouses land too.
    await waitFor(
      () => expect(Number(canvas.getByText(/\d+ tiles/).textContent!.match(/\d+/)![0])).toBeGreaterThanOrEqual(10),
      { timeout: 14000 },
    );
  },
};
// Each point of the game is played out once from the same seed, then reused.
const statesByTiles = new Map<number, GameState>();
let deckSize: number | undefined;
function stateAtProgress(progress: number): GameState {
  deckSize ??= populatedState(Infinity).board.getAllTiles().size;
  const tiles = Math.max(1, Math.round(progress * deckSize));
  if (!statesByTiles.has(tiles)) statesByTiles.set(tiles, populatedState(tiles));
  return statesByTiles.get(tiles)!;
}

/**
 * Drag through a whole game: the board grows tile by tile and the sun (or the
 * moon, at night) moves with it, as it would while playing.
 */
export const GameProgress: StoryObj<{ progress: number; night: boolean; extraVfx: boolean }> = {
  args: { progress: 0.5, night: false, extraVfx: false },
  argTypes: { progress: { control: { type: "range", min: 0, max: 1, step: 0.01 } } },
  render: ({ progress, night, extraVfx }) => (
    <BoardScene
      state={stateAtProgress(progress)}
      onTilePlace={() => {}}
      onUnavailable={() => {}}
      night={night}
      extraVfx={extraVfx}
    />
  ),
};

export const FullDeck: Story = { args: { state: populatedState(Infinity) } };
export const DroneView: Story = { args: { state: populatedState(Infinity), view: "drone" } };

const warehouseBoard = new Board();
warehouseExamples.forEach((example, i) => {
  example.records.forEach((record) => {
    const position = { x: record.position.x + i * 3.5, y: record.position.y };
    warehouseBoard.tiles.set(positionKey(position), { tile: record.tile, position });
  });
});
export const ConnectedWarehouses: Story = {
  args: { state: { ...populatedState(1), board: warehouseBoard, lastPlacedPosition: undefined } },
};

const finishedBoard = new Board();
const finishCap = (id: string, direction: "east" | "west") =>
  new Tile({
    id,
    name: id,
    edges: {
      north: "field",
      east: direction === "east" ? "costco" : "field",
      south: "field",
      west: direction === "west" ? "costco" : "field",
    },
    center: "field",
    roadConnections: [],
    costcoZones: [{ id: "shop", segments: [direction] }],
  });
finishedBoard.placeTile(finishCap("east-cap", "east"), { x: 0, y: 0 });
finishedBoard.placeTile(finishCap("west-cap", "west"), { x: 1, y: 0 });
export const CompletedCostco: Story = {
  args: {
    state: { ...populatedState(1), board: finishedBoard, lastPlacedPosition: { x: 1, y: 0 } },
    completedCostcos: completedCostcos(finishedBoard),
  },
};

const gallery = new Board();
const unique = [
  ...new Map(
    [getStartTile(), ...buildDeck(), getRiverSource(), ...buildRiverDeck(), getRiverLake()].map((tile) => [
      tile.id,
      tile,
    ]),
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
          "All 28 land and river tile types in library order. Each group of four shows 0°, 90°, 180°, and 270° clockwise rotations. The entire gallery shares one WebGL canvas.",
      },
    },
  },
};
