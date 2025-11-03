import type { Meta, StoryObj } from '@storybook/react-vite';
import { TileRenderer } from './TileRenderer';
import { Tile } from '../tile';
import { TileDefinition } from '../types';

// Get all tile definitions - we'll organize them by road/costco edges
const getAllTileDefinitions = (): Array<TileDefinition & { quantity: number }> => {
  return [
    {
      id: "starter-proper",
      name: "Costco Plaza Entrance",
      isStart: true,
      edges: { north: "costco", east: "road", south: "field", west: "road" },
      center: "field",
      roadConnections: [["east", "west"]],
      costcoZones: [
        {
          id: "plaza",
          segments: ["north"],
          hasPennant: false,
          shape: "straight",
        },
      ],
      quantity: 1,
    },
    {
      id: "straight-road",
      name: "Desert Highway",
      edges: { north: "road", east: "field", south: "road", west: "field" },
      center: "field",
      roadConnections: [["north", "south"]],
      costcoZones: [],
      quantity: 6,
    },
    {
      id: "curve-road",
      name: "Scenic Byway Curve",
      edges: { north: "road", east: "road", south: "field", west: "field" },
      center: "field",
      roadConnections: [["north", "east"]],
      costcoZones: [],
      quantity: 6,
    },
    {
      id: "road-end",
      name: "Dead End Street",
      edges: { north: "road", east: "field", south: "field", west: "field" },
      center: "field",
      roadConnections: [["north", "center"]],
      costcoZones: [],
      quantity: 5,
    },
    {
      id: "three-way-road",
      name: "Urban Cloverleaf",
      edges: { north: "road", east: "road", south: "field", west: "road" },
      center: "road",
      roadConnections: [
        ["north", "center"],
        ["east", "center"],
        ["west", "center"],
      ],
      costcoZones: [],
      quantity: 4,
    },
    {
      id: "four-way-road",
      name: "Four-Way Intersection",
      edges: { north: "road", east: "road", south: "road", west: "road" },
      center: "road",
      roadConnections: [
        ["north", "center"],
        ["east", "center"],
        ["south", "center"],
        ["west", "center"],
      ],
      costcoZones: [],
      quantity: 1,
    },
    {
      id: "costco-straight",
      name: "Costco Strip Mall",
      edges: { north: "costco", east: "field", south: "costco", west: "field" },
      center: "field",
      roadConnections: [],
      costcoZones: [
        {
          id: "strip-north",
          segments: ["north"],
          hasPennant: false,
          shape: "straight",
        },
        {
          id: "strip-south",
          segments: ["south"],
          hasPennant: false,
          shape: "straight",
        },
      ],
      quantity: 4,
    },
    {
      id: "costco-corner",
      name: "Costco Corner Plaza",
      edges: { north: "costco", east: "costco", south: "field", west: "field" },
      center: "field",
      roadConnections: [],
      costcoZones: [
        {
          id: "corner-plaza",
          segments: ["north", "east"],
          hasPennant: false,
          shape: "curved",
        },
      ],
      quantity: 4,
    },
    {
      id: "costco-road",
      name: "Costco Access Road",
      edges: { north: "costco", east: "road", south: "costco", west: "road" },
      center: "road",
      roadConnections: [
        ["east", "center"],
        ["west", "center"],
      ],
      costcoZones: [
        {
          id: "access-north",
          segments: ["north"],
          hasPennant: false,
          shape: "straight",
        },
        {
          id: "access-south",
          segments: ["south"],
          hasPennant: false,
          shape: "straight",
        },
      ],
      quantity: 3,
    },
    {
      id: "costco-cap",
      name: "Costco Parking Lot",
      edges: { north: "costco", east: "field", south: "field", west: "field" },
      center: "costco",
      roadConnections: [],
      costcoZones: [
        {
          id: "parking-lot",
          segments: ["north", "center"],
          hasPennant: true,
          shape: "straight",
        },
      ],
      quantity: 2,
    },
    {
      id: "mcdonalds-abbey",
      name: "McDonalds Abbey",
      edges: { north: "field", east: "field", south: "field", west: "field" },
      center: "mcdonalds",
      roadConnections: [],
      costcoZones: [],
      quantity: 4,
    },
    {
      id: "road-costco-split",
      name: "Shopping Center Entrance",
      edges: { north: "road", east: "costco", south: "road", west: "field" },
      center: "field",
      roadConnections: [["north", "south"]],
      costcoZones: [
        {
          id: "shopping-center",
          segments: ["east"],
          hasPennant: false,
          shape: "straight",
        },
      ],
      quantity: 3,
    },
    {
      id: "costco-complex-l",
      name: "Costco L-Shaped Complex",
      edges: { north: "costco", east: "costco", south: "field", west: "costco" },
      center: "field",
      roadConnections: [],
      costcoZones: [
        {
          id: "l-complex",
          segments: ["north", "east", "west"],
          hasPennant: true,
          shape: "complex",
        },
      ],
      quantity: 2,
    },
    {
      id: "costco-peninsula",
      name: "Costco Peninsula",
      edges: { north: "costco", east: "costco", south: "costco", west: "field" },
      center: "field",
      roadConnections: [],
      costcoZones: [
        {
          id: "peninsula",
          segments: ["north", "east", "south"],
          hasPennant: false,
          shape: "complex",
        },
      ],
      quantity: 3,
    },
    {
      id: "costco-separate-dual",
      name: "Dual Costco Zones",
      edges: { north: "costco", east: "field", south: "costco", west: "field" },
      center: "field",
      roadConnections: [],
      costcoZones: [
        {
          id: "dual-north",
          segments: ["north"],
          hasPennant: false,
          shape: "straight",
        },
        {
          id: "dual-south",
          segments: ["south"],
          hasPennant: true,
          shape: "straight",
        },
      ],
      quantity: 2,
    },
    {
      id: "costco-mega-complex",
      name: "Costco Mega Complex",
      edges: { north: "costco", east: "costco", south: "costco", west: "costco" },
      center: "costco",
      roadConnections: [],
      costcoZones: [
        {
          id: "mega-plaza",
          segments: ["north", "east", "south", "west", "center"],
          hasPennant: true,
          shape: "complex",
        },
      ],
      quantity: 1,
    },
    {
      id: "costco-bridge",
      name: "Costco Shopping Bridge",
      edges: { north: "field", east: "costco", south: "field", west: "costco" },
      center: "costco",
      roadConnections: [],
      costcoZones: [
        {
          id: "shopping-bridge",
          segments: ["east", "west", "center"],
          hasPennant: false,
          shape: "complex",
        },
      ],
      quantity: 2,
    },
  ];
};

// Helper to count edges of a specific type
const countEdges = (tile: TileDefinition & { quantity: number }, type: 'road' | 'costco'): number => {
  let count = 0;
  if (tile.edges.north === type) count++;
  if (tile.edges.east === type) count++;
  if (tile.edges.south === type) count++;
  if (tile.edges.west === type) count++;
  return count;
};

// Organize tiles by road and costco edges
const organizeTiles = () => {
  const allTiles = getAllTileDefinitions();
  const matrix: { [key: string]: Array<TileDefinition & { quantity: number }> } = {};
  
  allTiles.forEach(tile => {
    const roadEdges = countEdges(tile, 'road');
    const costcoEdges = countEdges(tile, 'costco');
    const key = `${roadEdges}-${costcoEdges}`;
    
    if (!matrix[key]) {
      matrix[key] = [];
    }
    matrix[key].push(tile);
  });
  
  return matrix;
};

const TileMatrixComponent = () => {
  const matrix = organizeTiles();
  const tileSize = 80;
  
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: '1600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem', textAlign: 'center', color: '#111827' }}>
        Non-Highway Terrain Tiles
      </h1>
      <p style={{ textAlign: 'center', color: '#4b5563', marginBottom: '2rem', fontSize: '1rem' }}>
        Tiles organized by Road edges (rows) and Costco edges (columns)
      </p>
      
      <div style={{ 
        display: 'inline-block',
        border: '2px solid #333',
        backgroundColor: '#e5e5e5'
      }}>
        {/* Header row */}
        <div style={{ display: 'flex' }}>
          <div style={{ 
            width: '120px',
            padding: '1rem',
            border: '1px solid #999',
            backgroundColor: '#d5d5d5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <div style={{ 
              position: 'absolute',
              top: '10px',
              left: '10px',
              fontSize: '0.875rem',
              fontWeight: 'bold'
            }}>
              Costco<br/>edges
            </div>
            <div style={{ 
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              fontSize: '0.875rem',
              fontWeight: 'bold'
            }}>
              Road<br/>edges
            </div>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '0',
              right: '0',
              borderTop: '2px solid #666',
              transform: 'rotate(-45deg)',
              transformOrigin: 'center'
            }} />
          </div>
          {[0, 1, 2, 3, 4].map(costcoCount => (
            <div 
              key={`header-${costcoCount}`}
              style={{ 
                width: '180px',
                padding: '1rem',
                border: '1px solid #999',
                backgroundColor: '#d5d5d5',
                textAlign: 'center',
                fontWeight: 'bold',
                fontSize: '1.25rem'
              }}
            >
              {costcoCount}
            </div>
          ))}
        </div>
        
        {/* Data rows */}
        {[0, 1, 2, 3, 4].map(roadCount => (
          <div key={`row-${roadCount}`} style={{ display: 'flex' }}>
            {/* Row header */}
            <div style={{ 
              width: '120px',
              padding: '1rem',
              border: '1px solid #999',
              backgroundColor: '#d5d5d5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1.25rem'
            }}>
              {roadCount}
            </div>
            
            {/* Cells for each costco count */}
            {[0, 1, 2, 3, 4].map(costcoCount => {
              const key = `${roadCount}-${costcoCount}`;
              const tiles = matrix[key] || [];
              
              return (
                <div 
                  key={`cell-${roadCount}-${costcoCount}`}
                  style={{ 
                    width: '180px',
                    minHeight: '100px',
                    padding: '0.5rem',
                    border: '1px solid #999',
                    backgroundColor: 'white',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    alignContent: 'flex-start',
                    alignItems: 'flex-start'
                  }}
                >
                  {tiles.map((tileDef, index) => (
                    <div 
                      key={`${tileDef.id}-${index}`}
                      style={{ 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <TileRenderer 
                        tile={new Tile(tileDef)} 
                        size={tileSize}
                      />
                      <div style={{ 
                        fontSize: '0.7rem',
                        textAlign: 'center',
                        maxWidth: `${tileSize}px`,
                        fontWeight: 'bold'
                      }}>
                        {tileDef.quantity}×
                        {tileDef.isStart && ' ⭐'}
                        {tileDef.costcoZones.some(z => z.hasPennant) && ' 🚩'}
                        {tileDef.center === 'mcdonalds' && ' 🍔'}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      
      <div style={{ 
        marginTop: '2rem',
        padding: '1rem',
        backgroundColor: '#f3f4f6',
        borderRadius: '8px',
        fontSize: '0.875rem',
        color: '#1f2937'
      }}>
        <h3 style={{ marginBottom: '0.5rem', color: '#111827' }}>Legend:</h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#374151' }}>
          <li>⭐ = Starting Tile</li>
          <li>🚩 = Has Pennant (bonus scoring)</li>
          <li>🍔 = McDonalds Abbey</li>
          <li>Numbers (e.g., "3×") = Quantity in deck</li>
        </ul>
        <p style={{ marginTop: '1rem', color: '#4b5563' }}>
          <strong style={{ color: '#111827' }}>Note:</strong> Tiles can be rotated during gameplay. Each cell shows tiles with the 
          specified number of road edges (rows) and Costco edges (columns) in their default orientation.
        </p>
      </div>
    </div>
  );
};

const meta = {
  title: 'Game/Tile Matrix',
  component: TileMatrixComponent,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TileMatrixComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TilesByEdgeType: Story = {};
