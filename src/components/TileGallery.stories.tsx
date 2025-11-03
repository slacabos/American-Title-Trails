import type { Meta, StoryObj } from '@storybook/react';
import { TileRenderer } from './TileRenderer';
import { Tile } from '../tile';
import { TileDefinition } from '../types';

// Import all tile definitions (we'll manually define them for the gallery)
const getAllTileDefinitions = (): TileDefinition[] => {
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
    },
    {
      id: "straight-road",
      name: "Desert Highway",
      edges: { north: "road", east: "field", south: "road", west: "field" },
      center: "field",
      roadConnections: [["north", "south"]],
      costcoZones: [],
    },
    {
      id: "curve-road",
      name: "Scenic Byway Curve",
      edges: { north: "road", east: "road", south: "field", west: "field" },
      center: "field",
      roadConnections: [["north", "east"]],
      costcoZones: [],
    },
    {
      id: "road-end",
      name: "Dead End Street",
      edges: { north: "road", east: "field", south: "field", west: "field" },
      center: "field",
      roadConnections: [["north", "center"]],
      costcoZones: [],
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
    },
    {
      id: "mcdonalds-abbey",
      name: "McDonalds Abbey",
      edges: { north: "field", east: "field", south: "field", west: "field" },
      center: "mcdonalds",
      roadConnections: [],
      costcoZones: [],
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
    },
  ];
};

const TileGalleryComponent = () => {
  const allTiles = getAllTileDefinitions();
  
  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem', fontFamily: 'system-ui', color: '#111827' }}>
        American Title Trails - Complete Tile Gallery
      </h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        {allTiles.map((tileDef) => (
          <div 
            key={tileDef.id} 
            style={{ 
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '1rem',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ marginBottom: '0.5rem' }}>
              <TileRenderer 
                tile={new Tile(tileDef)} 
                size={128}
              />
            </div>
            <div style={{ 
              fontSize: '0.875rem',
              fontFamily: 'system-ui',
              color: '#1f2937'
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: '#111827' }}>
                {tileDef.name}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                ID: {tileDef.id}
              </div>
              {tileDef.isStart && (
                <div style={{ 
                  color: '#059669', 
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  marginTop: '0.25rem'
                }}>
                  ⭐ Starting Tile
                </div>
              )}
              {tileDef.costcoZones.some(z => z.hasPennant) && (
                <div style={{ 
                  color: '#f59e0b', 
                  fontSize: '0.75rem',
                  marginTop: '0.25rem'
                }}>
                  🚩 Has Pennant
                </div>
              )}
              {tileDef.center === 'mcdonalds' && (
                <div style={{ 
                  color: '#dc2626', 
                  fontSize: '0.75rem',
                  marginTop: '0.25rem'
                }}>
                  🍔 McDonalds
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        borderTop: '1px solid #ddd',
        paddingTop: '2rem',
        fontFamily: 'system-ui',
        fontSize: '0.875rem',
        color: '#374151'
      }}>
        <h2 style={{ marginBottom: '1rem', color: '#111827' }}>Tile Statistics</h2>
        <ul style={{ color: '#1f2937' }}>
          <li>Total unique tiles: {allTiles.length}</li>
          <li>Road tiles: {allTiles.filter(t => t.roadConnections.length > 0).length}</li>
          <li>Costco tiles: {allTiles.filter(t => t.costcoZones.length > 0).length}</li>
          <li>McDonalds tiles: {allTiles.filter(t => t.center === 'mcdonalds').length}</li>
          <li>Tiles with pennants: {allTiles.filter(t => t.costcoZones.some(z => z.hasPennant)).length}</li>
        </ul>
      </div>
    </div>
  );
};

const meta = {
  title: 'Game/Tile Gallery',
  component: TileGalleryComponent,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TileGalleryComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllTiles: Story = {};
