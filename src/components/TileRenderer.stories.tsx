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

// --- Gallery visualization ---

const TileGallery = () => {
  const startTile = getStartTile();
  const deck = buildDeck();

  const tileGroups = {
    starter: [startTile],
    roads: deck.filter(
      (tile) =>
        tile.roadConnections.length > 0 &&
        tile.costcoZones.length === 0 &&
        tile.center !== "mcdonalds"
    ),
    costcoOnly: deck.filter(
      (tile) => tile.costcoZones.length > 0 && tile.roadConnections.length === 0
    ),
    costcoWithRoads: deck.filter(
      (tile) => tile.costcoZones.length > 0 && tile.roadConnections.length > 0
    ),
    mcdonalds: deck.filter((tile) => tile.center === "mcdonalds"),
  };

  const renderTileGroup = (title: string, tiles: Tile[], color: string) => (
    <div style={{ marginBottom: "32px" }}>
      <h3
        style={{
          color: color,
          borderBottom: `2px solid ${color}`,
          paddingBottom: "8px",
          marginBottom: "16px",
          fontSize: "18px",
          fontWeight: "bold",
        }}
      >
        {title} ({tiles.length} tiles)
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
          gap: "12px",
          maxWidth: "800px",
        }}
      >
        {tiles.map((tile, index) => (
          <div
            key={`${tile.id}-${index}`}
            style={{
              textAlign: "center",
              padding: "8px",
              border: "1px solid #e0e0e0",
              borderRadius: "4px",
              backgroundColor: "#fafafa",
            }}
          >
            <TileRenderer tile={tile} size={64} />
            <div
              style={{
                fontSize: "10px",
                marginTop: "4px",
                fontWeight: "500",
                color: "#666",
              }}
            >
              {tile.name}
            </div>
            <div
              style={{
                fontSize: "8px",
                color: "#999",
                marginTop: "2px",
              }}
            >
              {tile.id}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1
        style={{
          fontSize: "24px",
          marginBottom: "32px",
          textAlign: "center",
        }}
      >
        American Title Trails - Tile Gallery
      </h1>

      {renderTileGroup("Starter Tile", tileGroups.starter, "#ff6b35")}
      {renderTileGroup("Road Tiles", tileGroups.roads, "#8B4513")}
      {renderTileGroup("Costco Only", tileGroups.costcoOnly, "#4169E1")}
      {renderTileGroup(
        "Costco with Roads",
        tileGroups.costcoWithRoads,
        "#9932cc"
      )}
      {renderTileGroup("McDonalds Abbeys", tileGroups.mcdonalds, "#FFD700")}
    </div>
  );
};

const TileTable = () => {
  const startTile = getStartTile();
  const deck = buildDeck();

  const getCityEdgeCount = (tile: Tile): number => {
    const edges = [
      tile.getEdge("north"),
      tile.getEdge("east"),
      tile.getEdge("south"),
      tile.getEdge("west"),
    ];
    return edges.filter((edge) => edge === "costco").length;
  };

  const getRoadEdgeCount = (tile: Tile): number => {
    const edges = [
      tile.getEdge("north"),
      tile.getEdge("east"),
      tile.getEdge("south"),
      tile.getEdge("west"),
    ];
    return edges.filter((edge) => edge === "road").length;
  };

  const tileMatrix: { [key: string]: Tile[] } = {};

  [startTile, ...deck].forEach((tile) => {
    const cityEdges = getCityEdgeCount(tile);
    const roadEdges = getRoadEdgeCount(tile);
    const key = `${cityEdges}-${roadEdges}`;

    if (!tileMatrix[key]) {
      tileMatrix[key] = [];
    }
    tileMatrix[key].push(tile);
  });

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
        Tile Distribution Matrix
      </h2>
      <table
        style={{
          borderCollapse: "collapse",
          margin: "0 auto",
          border: "2px solid #333",
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                border: "1px solid #333",
                padding: "8px",
                backgroundColor: "#f0f0f0",
                minWidth: "60px",
              }}
            >
              City↓ Road→
            </th>
            {[0, 1, 2, 3, 4].map((roadCount) => (
              <th
                key={roadCount}
                style={{
                  border: "1px solid #333",
                  padding: "8px",
                  backgroundColor: "#f0f0f0",
                  minWidth: "80px",
                }}
              >
                {roadCount}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2, 3, 4].map((cityCount) => (
            <tr key={cityCount}>
              <th
                style={{
                  border: "1px solid #333",
                  padding: "8px",
                  backgroundColor: "#f0f0f0",
                }}
              >
                {cityCount}
              </th>
              {[0, 1, 2, 3, 4].map((roadCount) => {
                const key = `${cityCount}-${roadCount}`;
                const tiles = tileMatrix[key] || [];

                return (
                  <td
                    key={roadCount}
                    style={{
                      border: "1px solid #333",
                      padding: "8px",
                      textAlign: "center",
                      verticalAlign: "top",
                      backgroundColor: tiles.length > 0 ? "#fff" : "#f8f8f8",
                    }}
                  >
                    {tiles.length > 0 && (
                      <div>
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "4px",
                            justifyContent: "center",
                            marginBottom: "4px",
                          }}
                        >
                          {tiles.slice(0, 4).map((tile, index) => (
                            <TileRenderer
                              key={`${tile.id}-${index}`}
                              tile={tile}
                              size={32}
                            />
                          ))}
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: "bold" }}>
                          {tiles.length}x
                        </div>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const AllTiles: Story = {
  render: () => <TileGallery />,
  parameters: {
    layout: "fullscreen",
  },
};

export const TileMatrix: Story = {
  render: () => <TileTable />,
  parameters: {
    layout: "fullscreen",
  },
};

// --- Tile quantities visualization ---

const getTileQuantities = () => {
  const startTile = getStartTile();
  const deck = buildDeck();

  const quantities: Record<string, { tile: Tile; count: number }> = {};

  quantities[startTile.id] = { tile: startTile, count: 1 };

  deck.forEach((tile) => {
    if (quantities[tile.id]) {
      quantities[tile.id].count++;
    } else {
      quantities[tile.id] = { tile, count: 1 };
    }
  });

  return quantities;
};

const TileQuantityOverview = () => {
  const quantities = getTileQuantities();
  const totalTiles = Object.values(quantities).reduce(
    (sum, { count }) => sum + count,
    0
  );

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1
        style={{
          fontSize: "24px",
          marginBottom: "20px",
          textAlign: "center",
          color: "#333",
        }}
      >
        American Title Trails - Tile Distribution
      </h1>

      <div
        style={{
          backgroundColor: "#f0f0f0",
          padding: "16px",
          borderRadius: "8px",
          marginBottom: "24px",
          textAlign: "center",
        }}
      >
        <h3 style={{ margin: "0 0 8px 0", color: "#555" }}>
          Total Tiles in Game
        </h3>
        <div style={{ fontSize: "32px", fontWeight: "bold", color: "#333" }}>
          {totalTiles}
        </div>
        <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
          Including 1 starter tile + {totalTiles - 1} deck tiles
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "16px",
        }}
      >
        {Object.entries(quantities)
          .sort(([, a], [, b]) => b.count - a.count)
          .map(([tileId, { tile, count }]) => (
            <div
              key={tileId}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "16px",
                backgroundColor: "#fff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "12px",
                }}
              >
                <TileRenderer tile={tile} size={64} />
                <div style={{ flex: 1 }}>
                  <h4
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "16px",
                      color: "#333",
                    }}
                  >
                    {tile.name}
                  </h4>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      fontFamily: "monospace",
                    }}
                  >
                    {tile.id}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    color: count === 1 ? "#ff6b35" : "#4169E1",
                    textAlign: "center",
                  }}
                >
                  {count}×
                </div>
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#666",
                  borderTop: "1px solid #eee",
                  paddingTop: "8px",
                }}
              >
                <div>
                  <strong>Center:</strong> {tile.center}
                </div>
                <div>
                  <strong>Roads:</strong>{" "}
                  {tile.roadConnections.length > 0 ? "Yes" : "No"}
                </div>
                <div>
                  <strong>Costco Zones:</strong> {tile.costcoZones.length}
                </div>
                {tile.isStart && (
                  <div
                    style={{
                      color: "#ff6b35",
                      fontWeight: "bold",
                      marginTop: "4px",
                    }}
                  >
                    ⭐ STARTER TILE
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

      <div
        style={{
          marginTop: "32px",
          padding: "16px",
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          border: "1px solid #dee2e6",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#495057" }}>Summary Statistics</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            fontSize: "14px",
          }}
        >
          <div>
            <strong>Unique Tiles:</strong> {Object.keys(quantities).length}
          </div>
          <div>
            <strong>Most Common:</strong>{" "}
            {(() => {
              const mostCommon = Object.values(quantities).reduce(
                (max, current) => (current.count > max.count ? current : max)
              );
              return `${mostCommon.tile.name} (${mostCommon.count}×)`;
            })()}
          </div>
          <div>
            <strong>Road Tiles:</strong>{" "}
            {Object.values(quantities)
              .filter(({ tile }) => tile.roadConnections.length > 0)
              .reduce((sum, { count }) => sum + count, 0)}
          </div>
          <div>
            <strong>Costco Tiles:</strong>{" "}
            {Object.values(quantities)
              .filter(({ tile }) => tile.costcoZones.length > 0)
              .reduce((sum, { count }) => sum + count, 0)}
          </div>
        </div>
      </div>
    </div>
  );
};

export const TileDistribution: Story = {
  render: () => <TileQuantityOverview />,
  parameters: {
    layout: "fullscreen",
  },
};
