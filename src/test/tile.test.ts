import { describe, it, expect, beforeEach } from 'vitest';
import { Tile } from '../tile';
import { TileDefinition, TerrainType } from '../types';

describe('Tile', () => {
  let basicTile: Tile;
  let roadTile: Tile;
  let costcoTile: Tile;

  beforeEach(() => {
    // Basic tile with all field edges
    const basicDef: TileDefinition = {
      id: 'test-1',
      name: 'Test Basic',
      edges: {
        north: 'field' as TerrainType,
        east: 'field' as TerrainType,
        south: 'field' as TerrainType,
        west: 'field' as TerrainType,
      },
      center: 'field' as TerrainType,
      roadConnections: [],
      costcoZones: [],
    };
    basicTile = new Tile(basicDef);

    // Tile with roads
    const roadDef: TileDefinition = {
      id: 'test-2',
      name: 'Test Road',
      edges: {
        north: 'road' as TerrainType,
        east: 'field' as TerrainType,
        south: 'road' as TerrainType,
        west: 'field' as TerrainType,
      },
      center: 'intersection' as TerrainType,
      roadConnections: [['north', 'south']],
      costcoZones: [],
    };
    roadTile = new Tile(roadDef);

    // Tile with Costco zone
    const costcoDef: TileDefinition = {
      id: 'test-3',
      name: 'Test Costco',
      edges: {
        north: 'costco' as TerrainType,
        east: 'costco' as TerrainType,
        south: 'field' as TerrainType,
        west: 'field' as TerrainType,
      },
      center: 'field' as TerrainType,
      roadConnections: [],
      costcoZones: [
        {
          id: 'zone1',
          segments: ['north', 'east'],
          hasPennant: true,
          shape: 'curved',
        },
      ],
    };
    costcoTile = new Tile(costcoDef);
  });

  describe('Constructor', () => {
    it('should create a tile with correct properties', () => {
      expect(basicTile.id).toBe('test-1');
      expect(basicTile.name).toBe('Test Basic');
      expect(basicTile.center).toBe('field');
      expect(basicTile.isStart).toBe(false);
      expect(basicTile.orientation).toBe(0);
    });

    it('should initialize empty arrays for optional properties', () => {
      expect(basicTile.roadConnections).toEqual([]);
      expect(basicTile.costcoZones).toEqual([]);
    });

    it('should deep copy roadConnections', () => {
      const originalConnections = [['north', 'south']];
      const roadDef: TileDefinition = {
        id: 'test-deep-copy',
        name: 'Test Deep Copy',
        edges: {
          north: 'road' as TerrainType,
          east: 'field' as TerrainType,
          south: 'road' as TerrainType,
          west: 'field' as TerrainType,
        },
        center: 'intersection' as TerrainType,
        roadConnections: originalConnections,
        costcoZones: [],
      };
      const tile = new Tile(roadDef);
      
      expect(tile.roadConnections).toEqual(originalConnections);
      expect(tile.roadConnections).not.toBe(originalConnections);
      expect(tile.roadConnections[0]).not.toBe(originalConnections[0]);
    });

    it('should deep copy costcoZones', () => {
      expect(costcoTile.costcoZones).toHaveLength(1);
      expect(costcoTile.costcoZones[0].id).toBe('zone1');
      expect(costcoTile.costcoZones[0].hasPennant).toBe(true);
      expect(costcoTile.costcoZones[0].segments).toEqual(['north', 'east']);
    });
  });

  describe('edgeAt', () => {
    it('should return correct edge terrain for each direction', () => {
      expect(basicTile.edgeAt('north')).toBe('field');
      expect(basicTile.edgeAt('east')).toBe('field');
      expect(basicTile.edgeAt('south')).toBe('field');
      expect(basicTile.edgeAt('west')).toBe('field');
    });

    it('should return correct edges for road tile', () => {
      expect(roadTile.edgeAt('north')).toBe('road');
      expect(roadTile.edgeAt('east')).toBe('field');
      expect(roadTile.edgeAt('south')).toBe('road');
      expect(roadTile.edgeAt('west')).toBe('field');
    });

    it('should throw error for invalid direction', () => {
      expect(() => basicTile.edgeAt('invalid' as any)).toThrow(
        'Unknown direction invalid'
      );
    });
  });

  describe('rotate', () => {
    it('should return a clone when rotating 0 times', () => {
      const rotated = roadTile.rotate(0);
      expect(rotated).not.toBe(roadTile);
      expect(rotated.id).toBe(roadTile.id);
      expect(rotated.orientation).toBe(0);
    });

    it('should rotate edges clockwise by 90 degrees', () => {
      const rotated = roadTile.rotate(1);
      expect(rotated.edgeAt('north')).toBe('field');
      expect(rotated.edgeAt('east')).toBe('road');
      expect(rotated.edgeAt('south')).toBe('field');
      expect(rotated.edgeAt('west')).toBe('road');
      expect(rotated.orientation).toBe(1);
    });

    it('should rotate edges by 180 degrees', () => {
      const rotated = roadTile.rotate(2);
      expect(rotated.edgeAt('north')).toBe('road');
      expect(rotated.edgeAt('east')).toBe('field');
      expect(rotated.edgeAt('south')).toBe('road');
      expect(rotated.edgeAt('west')).toBe('field');
      expect(rotated.orientation).toBe(2);
    });

    it('should rotate edges by 270 degrees (3 times)', () => {
      const rotated = roadTile.rotate(3);
      expect(rotated.edgeAt('north')).toBe('field');
      expect(rotated.edgeAt('east')).toBe('road');
      expect(rotated.edgeAt('south')).toBe('field');
      expect(rotated.edgeAt('west')).toBe('road');
      expect(rotated.orientation).toBe(3);
    });

    it('should handle full rotation (4 times = 360 degrees)', () => {
      const rotated = roadTile.rotate(4);
      expect(rotated.edgeAt('north')).toBe('road');
      expect(rotated.edgeAt('east')).toBe('field');
      expect(rotated.edgeAt('south')).toBe('road');
      expect(rotated.edgeAt('west')).toBe('field');
      expect(rotated.orientation).toBe(0);
    });

    it('should handle negative rotations', () => {
      const rotated = roadTile.rotate(-1);
      expect(rotated.edgeAt('north')).toBe('field');
      expect(rotated.edgeAt('east')).toBe('road');
      expect(rotated.edgeAt('south')).toBe('field');
      expect(rotated.edgeAt('west')).toBe('road');
    });

    it('should rotate road connections', () => {
      const rotated = roadTile.rotate(1);
      expect(rotated.roadConnections).toEqual([['east', 'west']]);
    });

    it('should rotate costco zones', () => {
      const rotated = costcoTile.rotate(1);
      expect(rotated.costcoZones[0].segments).toEqual(['east', 'south']);
    });

    it('should preserve pennant flags during rotation', () => {
      const rotated = costcoTile.rotate(1);
      expect(rotated.costcoZones[0].hasPennant).toBe(true);
    });

    it('should not mutate original tile', () => {
      const originalEdge = roadTile.edgeAt('north');
      roadTile.rotate(1);
      expect(roadTile.edgeAt('north')).toBe(originalEdge);
    });
  });

  describe('clone', () => {
    it('should create an independent copy', () => {
      const cloned = roadTile.clone();
      expect(cloned).not.toBe(roadTile);
      expect(cloned.id).toBe(roadTile.id);
      expect(cloned.name).toBe(roadTile.name);
    });

    it('should preserve orientation', () => {
      const rotated = roadTile.rotate(2);
      const cloned = rotated.clone();
      expect(cloned.orientation).toBe(2);
    });

    it('should deep copy arrays', () => {
      const cloned = roadTile.clone();
      expect(cloned.roadConnections).toEqual(roadTile.roadConnections);
      expect(cloned.roadConnections).not.toBe(roadTile.roadConnections);
    });

    it('should preserve all properties', () => {
      const cloned = costcoTile.clone();
      expect(cloned.costcoZones).toEqual(costcoTile.costcoZones);
      expect(cloned.center).toBe(costcoTile.center);
      expect(cloned.isStart).toBe(costcoTile.isStart);
    });
  });

  describe('Immutability', () => {
    it('should not allow modification of original after rotation', () => {
      const originalEdge = roadTile.edgeAt('north');
      roadTile.rotate(1);
      expect(roadTile.edgeAt('north')).toBe(originalEdge);
    });

    it('should create independent road connections', () => {
      const rotated = roadTile.rotate(1);
      rotated.roadConnections[0][0] = 'modified' as any;
      expect(roadTile.roadConnections[0][0]).toBe('north');
    });
  });
});
