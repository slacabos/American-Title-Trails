import type { Meta, StoryObj } from "@storybook/react";
import { TileRenderer } from "./TileRenderer";
import { getStartTile } from "../tileLibrary";

// Get a sample tile for the story
const sampleTile = getStartTile();

const meta: Meta<typeof TileRenderer> = {
  title: "Game/TileRenderer",
  component: TileRenderer,
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
    tile: {
      description: "The tile object to render",
      control: false,
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
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with the start tile
export const Default: Story = {
  args: {
    tile: sampleTile,
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
  render: (args) => (
    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <TileRenderer {...args} rotation={0} />
        <div style={{ marginTop: "8px", fontSize: "12px" }}>0°</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <TileRenderer {...args} rotation={90} />
        <div style={{ marginTop: "8px", fontSize: "12px" }}>90°</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <TileRenderer {...args} rotation={180} />
        <div style={{ marginTop: "8px", fontSize: "12px" }}>180°</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <TileRenderer {...args} rotation={270} />
        <div style={{ marginTop: "8px", fontSize: "12px" }}>270°</div>
      </div>
    </div>
  ),
  args: {
    tile: sampleTile,
    size: 96,
    showPreview: false,
  },
};
