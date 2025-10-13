import type { Meta, StoryObj } from "@storybook/react";
import { TileRenderer } from "./TileRenderer";
import { getStartTile, buildDeck } from "../tileLibrary";
import { Tile } from "../tile";

// Get all available tiles
const startTile = getStartTile();
const deck = buildDeck();
const allTiles = [startTile, ...deck];

// Create a unique list of tiles (remove duplicates by ID)
const uniqueTiles = allTiles.reduce((acc, tile) => {
  if (!acc.find((t) => t.id === tile.id)) {
    acc.push(tile);
  }
  return acc;
}, [] as Tile[]);

// Create tile options for the select control
const tileOptions = uniqueTiles.reduce((acc, tile) => {
  acc[tile.name] = tile;
  return acc;
}, {} as Record<string, Tile>);

// Create a custom interface for story args that includes tile selection
interface TileRendererStoryArgs {
  selectedTile: string;
  size: number;
  rotation: number;
  showPreview: boolean;
  className: string;
}

const meta: Meta<TileRendererStoryArgs> = {
  title: "Game/TileRenderer",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "TileRenderer is used to draw individual tiles on the canvas. It supports rotation, sizing, and preview modes.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    selectedTile: {
      description: "The tile to render",
      control: { type: "select" },
      options: Object.keys(tileOptions),
    },
    size: {
      description: "Size of the tile in pixels",
      control: { type: "range", min: 32, max: 256, step: 16 },
    },
    rotation: {
      description: "Rotation angle in degrees (0, 90, 180, 270)",
      control: { type: "select" },
      options: [0, 90, 180, 270],
    },
    showPreview: {
      description: "Show preview overlay (white transparency)",
      control: "boolean",
    },
    className: {
      description: "Additional CSS classes",
      control: "text",
    },
  },
  render: (args) => {
    const selectedTile = tileOptions[args.selectedTile];
    return (
      <TileRenderer
        tile={selectedTile}
        size={args.size}
        rotation={args.rotation}
        showPreview={args.showPreview}
        className={args.className}
      />
    );
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with the start tile
export const Default: Story = {
  args: {
    selectedTile: startTile.name,
    size: 128,
    rotation: 0,
    showPreview: false,
    className: "",
  },
};

// Different rotations
export const Rotated90: Story = {
  args: {
    ...Default.args,
    rotation: 90,
  },
};

export const Rotated180: Story = {
  args: {
    ...Default.args,
    rotation: 180,
  },
};

export const Rotated270: Story = {
  args: {
    ...Default.args,
    rotation: 270,
  },
};

// Different sizes
export const Small: Story = {
  args: {
    ...Default.args,
    size: 64,
  },
};

export const Large: Story = {
  args: {
    ...Default.args,
    size: 192,
  },
};

// With preview overlay
export const WithPreview: Story = {
  args: {
    ...Default.args,
    showPreview: true,
  },
};

// All rotations side by side
export const AllRotations: Story = {
  render: (args) => {
    const selectedTile = tileOptions[args.selectedTile];
    return (
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <TileRenderer
            tile={selectedTile}
            size={args.size}
            rotation={0}
            showPreview={args.showPreview}
            className={args.className}
          />
          <div style={{ marginTop: "8px", fontSize: "12px" }}>0°</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <TileRenderer
            tile={selectedTile}
            size={args.size}
            rotation={90}
            showPreview={args.showPreview}
            className={args.className}
          />
          <div style={{ marginTop: "8px", fontSize: "12px" }}>90°</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <TileRenderer
            tile={selectedTile}
            size={args.size}
            rotation={180}
            showPreview={args.showPreview}
            className={args.className}
          />
          <div style={{ marginTop: "8px", fontSize: "12px" }}>180°</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <TileRenderer
            tile={selectedTile}
            size={args.size}
            rotation={270}
            showPreview={args.showPreview}
            className={args.className}
          />
          <div style={{ marginTop: "8px", fontSize: "12px" }}>270°</div>
        </div>
      </div>
    );
  },
  args: {
    selectedTile: startTile.name,
    size: 96,
    showPreview: false,
    className: "",
  },
};
