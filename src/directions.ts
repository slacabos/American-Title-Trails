import { Direction, Position } from "./types";

export const DIRECTIONS: Direction[] = ["north", "east", "south", "west"];

export const OPPOSITE: Record<Direction, Direction> = {
  north: "south",
  east: "west",
  south: "north",
  west: "east",
};

export const DELTAS: Record<Direction, Position> = {
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 },
};

export const rotateDirection = (direction: string, times: number): string => {
  if (direction === "center") {
    return "center";
  }
  const normalized = ((times % 4) + 4) % 4;
  const index = DIRECTIONS.indexOf(direction as Direction);
  if (index === -1) {
    throw new Error(`Unknown direction: ${direction}`);
  }
  const newIndex = (index + normalized) % DIRECTIONS.length;
  return DIRECTIONS[newIndex];
};
