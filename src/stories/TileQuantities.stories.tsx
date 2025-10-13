import type { Meta, StoryObj } from "@storybook/react";
import { TileRenderer } from "../components/TileRenderer";
import { Tile } from "../tile";
import { buildDeck, getStartTile } from "../tileLibrary";

// Get tile quantities from the deck
const getTileQuantities = () => {
  const startTile = getStartTile();
  const deck = buildDeck();

  // Count each unique tile in the deck
  const quantities: Record<string, { tile: Tile; count: number }> = {};

  // Add starter tile
  quantities[startTile.id] = { tile: startTile, count: 1 };

  // Count deck tiles
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
          .sort(([, a], [, b]) => b.count - a.count) // Sort by quantity descending
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

const meta: Meta = {
  title: "Game/Tile Quantities",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Overview of tile distribution and quantities in the American Title Trails deck.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const TileDistribution: Story = {
  render: () => <TileQuantityOverview />,
  parameters: {
    docs: {
      description: {
        story:
          "Shows the quantity of each tile type in the game deck, sorted by frequency. Includes summary statistics about the deck composition.",
      },
    },
  },
};
