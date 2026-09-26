import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ComponentProps, useEffect, useState } from "react";
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
import { gameProgress, skyPose } from "@/rendering/skyPath";

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
/** Flat sliders for tuning the light; they fill in the board's `sky` override. */
type BoardStoryArgs = ComponentProps<typeof BoardScene> & {
  /** Empty follows the story's game; 0 is the first tile, 1 the last. */
  skyProgress?: number;
  sunBrightness: number;
  ambientBrightness: number;
};

/** The light the sliders produce, in the numbers skyPath.ts uses. */
function SkyReadout({
  progress,
  night,
  sun,
  ambient,
}: {
  progress: number;
  night: boolean;
  sun: number;
  ambient: number;
}) {
  const pose = skyPose(progress, night);
  const degrees = (radians: number) => Math.round((radians * 180) / Math.PI);
  const rows: [string, string][] = [
    ["progress", progress.toFixed(2)],
    ["elevation", `${degrees(Math.asin(pose.direction.y))}°`],
    ["from", `${degrees(Math.atan2(pose.direction.z, pose.direction.x))}° (0 east, 90 south)`],
    [night ? "moon" : "sun", `${(pose.intensity * sun).toFixed(2)}  #${pose.color.getHexString()}`],
    ["ambient", `${(pose.ambient * ambient).toFixed(2)}  #${pose.sky.getHexString()} / #${pose.ground.getHexString()}`],
  ];
  return (
    <dl
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        margin: 0,
        padding: "8px 12px",
        display: "grid",
        gridTemplateColumns: "auto auto",
        gap: "2px 12px",
        font: "12px/1.4 ui-monospace, monospace",
        background: "rgb(255 255 255 / 0.85)",
        color: "#1f2e27",
        borderRadius: 8,
      }}
    >
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: "contents" }}>
          <dt>{label}</dt>
          <dd style={{ margin: 0 }}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

const meta: Meta<BoardStoryArgs> = {
  title: "Game/3D Tabletop",
  component: BoardScene,
  parameters: { layout: "fullscreen" },
  argTypes: {
    skyProgress: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    sunBrightness: { control: { type: "range", min: 0.4, max: 1.6, step: 0.05 } },
    ambientBrightness: { control: { type: "range", min: 0.4, max: 1.6, step: 0.05 } },
    sky: { table: { disable: true } },
  },
  render: ({ skyProgress, sunBrightness, ambientBrightness, ...args }) => {
    const progress = skyProgress ?? gameProgress(args.state.board.getAllTiles().size, args.state.tileDeck.length);
    return (
      <>
        <BoardScene
          {...args}
          sky={{ progress: skyProgress, keyScale: sunBrightness, ambientScale: ambientBrightness }}
        />
        <SkyReadout progress={progress} night={!!args.night} sun={sunBrightness} ambient={ambientBrightness} />
      </>
    );
  },
  decorators: [
    (Story) => (
      <div style={{ position: "relative", height: "85vh", minHeight: 600 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    onTilePlace: () => {},
    onUnavailable: () => {},
    state: populatedState(24),
    sunBrightness: 1,
    ambientBrightness: 1,
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
/** The sun rises in the east as a game starts and sets in the west as the deck runs out. */
export const Morning: Story = { args: { state: populatedState(4) } };
/** The last tile placed: golden hour. */
export const FullDeck: Story = { args: { state: populatedState(Infinity) } };
export const MoonriseAtNight: Story = { args: { state: populatedState(4), night: true } };
export const MoonsetAtNight: Story = { args: { state: populatedState(Infinity), night: true } };
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
