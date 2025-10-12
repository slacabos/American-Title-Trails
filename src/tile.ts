import { DIRECTIONS, rotateDirection } from "./directions";
import {
  CostcoZoneDefinition,
  Direction,
  NormalizedPoint,
  TileDefinition,
  TileEdges,
  TerrainType,
} from "./types";

const directionIndex = (direction: Direction): number =>
  DIRECTIONS.indexOf(direction);

const cloneZone = (zone: CostcoZoneDefinition): CostcoZoneDefinition => ({
  id: zone.id,
  edges: [...zone.edges],
  polygon: zone.polygon.map((point) => ({ ...point })),
  pennants: zone.pennants,
});

const rotatePoint = (
  point: NormalizedPoint,
  times: number
): NormalizedPoint => {
  const normalized = ((times % 4) + 4) % 4;
  let current = { ...point };
  for (let i = 0; i < normalized; i += 1) {
    current = { x: 1 - current.y, y: current.x };
  }
  return current;
};

export class Tile {
  public readonly id: string;
  public readonly name: string;
  public readonly center: TerrainType;
  public readonly roadConnections: string[][];
  public readonly costcoZones: CostcoZoneDefinition[];
  public readonly isStart: boolean;
  public readonly orientation: number;
  private readonly edges: TerrainType[];

  constructor({
    id,
    name,
    edges,
    center = "field" as TerrainType,
    roadConnections = [],
    costcoZones = [],
    isStart = false,
  }: TileDefinition) {
    this.id = id;
    this.name = name;
    this.center = center;
    this.roadConnections = roadConnections.map((connection) => [...connection]);
    this.costcoZones = costcoZones.map((zone) => cloneZone(zone));
    this.isStart = isStart;
    this.orientation = 0;

    this.edges = DIRECTIONS.map((direction) => edges[direction]);
  }

  rotate(times = 1): Tile {
    const normalized = ((times % 4) + 4) % 4;
    if (normalized === 0) {
      return this.clone();
    }

    const rotatedEdges = this.edges.map((_, index, array) => {
      const rotatedIndex = (index - normalized + array.length) % array.length;
      return array[rotatedIndex];
    });

    const rotateCollection = (collection: string[][]): string[][] =>
      collection.map((items) =>
        items.map((item) => rotateDirection(item, normalized))
      );

    const rotateZones = (
      zones: CostcoZoneDefinition[]
    ): CostcoZoneDefinition[] =>
      zones.map((zone) => ({
        id: zone.id,
        edges: zone.edges.map((edge) =>
          edge === "center" ? "center" : rotateDirection(edge, normalized)
        ),
        polygon: zone.polygon.map((point) => rotatePoint(point, normalized)),
        pennants: zone.pennants,
      }));

    const rotated = new Tile({
      id: this.id,
      name: this.name,
      edges: {
        north: rotatedEdges[0],
        east: rotatedEdges[1],
        south: rotatedEdges[2],
        west: rotatedEdges[3],
      } as TileEdges,
      center: this.center,
      roadConnections: rotateCollection(this.roadConnections),
      costcoZones: rotateZones(this.costcoZones),
      isStart: this.isStart,
    });

    (rotated as any).orientation = (this.orientation + normalized) % 4;
    return rotated;
  }

  clone(): Tile {
    const clone = new Tile({
      id: this.id,
      name: this.name,
      edges: {
        north: this.edges[0],
        east: this.edges[1],
        south: this.edges[2],
        west: this.edges[3],
      } as TileEdges,
      center: this.center,
      roadConnections: this.roadConnections,
      costcoZones: this.costcoZones.map((zone) => cloneZone(zone)),
      isStart: this.isStart,
    });
    (clone as any).orientation = this.orientation;
    return clone;
  }

  edgeAt(direction: Direction): TerrainType {
    const index = directionIndex(direction);
    if (index === -1) {
      throw new Error(`Unknown direction ${direction}`);
    }
    return this.edges[index];
  }
}

export const TileDirections = DIRECTIONS;
