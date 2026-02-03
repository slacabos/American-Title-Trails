import type { Meta, StoryObj } from "@storybook/react";
import { TileRenderer } from "../components/TileRenderer";
import { Tile } from "../tile";
import { buildDeck, getStartTile } from "../tileLibrary";

// Create a component that shows all tiles organized by type
const TileGallery = () => {
  const startTile = getStartTile();
  const deck = buildDeck();

  // Group tiles by their characteristics for better organization
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

// Create a table view similar to the reference image
const TileTable = () => {
  const startTile = getStartTile();
  const deck = buildDeck();

  // Count tiles by city edges and road edges
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

  // Group tiles by edge counts
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

const meta: Meta = {
  title: "Game/Tile Gallery",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A comprehensive view of all tiles in the American Title Trails game, organized by type and characteristics.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const AllTiles: Story = {
  render: () => <TileGallery />,
  parameters: {
    docs: {
      description: {
        story:
          "Shows all tiles organized by their game function: roads, Costco zones, McDonalds, etc.",
      },
    },
  },
};

export const TileMatrix: Story = {
  render: () => <TileTable />,
  parameters: {
    docs: {
      description: {
        story:
          "A matrix view showing tile distribution based on the number of city (Costco) edges and road edges, similar to the reference table.",
      },
    },
  },
};
