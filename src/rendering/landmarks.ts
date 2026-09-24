import * as THREE from "three";
import type { ITile } from "@/interfaces/ITile";
import type { ClaimableFeature } from "@/types";
import type { PropBuilder } from "./paint";
import { nearRiver, restaurantPosition, tileRoadPath } from "./riverLayout";
import { featureAnchor, insidePolygon, Point, ROAD_WIDTH, zonePolygon } from "./tileLayout";

export type LandmarkKind =
  | "billboard"
  | "overlook"
  | "barn"
  | "house"
  | "menu-board"
  | "picnic"
  | "lamp";

export interface Landmark {
  kind: LandmarkKind;
  at: Point;
  /** Radians about Y; 0 faces south (+z). */
  yaw?: number;
}

/** Man-made landmarks in canonical tile space. They fit every region. */
export const LANDMARKS: Record<string, Landmark[]> = {
  "straight-road": [{ kind: "billboard", at: [0.25, 0.02], yaw: -Math.PI / 2 }],
  "curve-road": [{ kind: "overlook", at: [-0.1, 0.12], yaw: Math.PI * 0.75 }],
  "three-way-road": [
    { kind: "barn", at: [-0.06, 0.27] },
    { kind: "lamp", at: [0.2, -0.14] },
  ],
  "road-end": [
    { kind: "house", at: [-0.15, 0.24], yaw: Math.PI },
    { kind: "house", at: [0.15, 0.24], yaw: Math.PI },
    { kind: "lamp", at: [0.12, -0.2] },
  ],
  "mcdonalds-abbey": [{ kind: "menu-board", at: [0.21, 0.06], yaw: -Math.PI / 2 }],
  "river-bend": [{ kind: "picnic", at: [0.14, 0.18], yaw: 0.4 }],
  "starter-proper": [
    { kind: "lamp", at: [-0.22, 0.17] },
    { kind: "lamp", at: [0.22, 0.17] },
  ],
  "river-road-bridge": [
    { kind: "lamp", at: [-0.32, 0.15] },
    { kind: "lamp", at: [0.32, -0.15] },
  ],
};

/** Radius each landmark occupies on the ground, used to keep features readable. */
export const LANDMARK_RADIUS: Record<LandmarkKind, number> = {
  billboard: 0.1,
  overlook: 0.08,
  barn: 0.13,
  house: 0.07,
  "menu-board": 0.04,
  picnic: 0.06,
  lamp: 0.02,
};

const WOOD = "#8a6a45";
const WOOD_LIGHT = "#b28c5b";
const METAL = "#667b7e";
const LAMP_HEAD = "#fff0c8";

/** A pitched roof: ridge along x, eaves `span` wide along z, base at y = 0. */
function gable(span: number, rise: number, length: number): THREE.BufferGeometry {
  const shape = new THREE.Shape([
    new THREE.Vector2(-span / 2, 0),
    new THREE.Vector2(span / 2, 0),
    new THREE.Vector2(0, rise),
  ]);
  return new THREE.ExtrudeGeometry(shape, { depth: length, bevelEnabled: false })
    .translate(0, 0, -length / 2)
    .rotateY(Math.PI / 2);
}

export function buildLandmark(props: PropBuilder, { kind, at: [x, z], yaw = 0 }: Landmark): void {
  // Offsets are authored facing south, then turned by `yaw` about the landmark.
  const at = (dx: number, dz: number): [number, number] => [
    x + dx * Math.cos(yaw) + dz * Math.sin(yaw),
    z - dx * Math.sin(yaw) + dz * Math.cos(yaw),
  ];
  const point = (dx: number, y: number, dz: number) => {
    const [px, pz] = at(dx, dz);
    return new THREE.Vector3(px, y, pz);
  };
  const block = (dx: number, y: number, dz: number, w: number, h: number, d: number, color: string, lit = false) => {
    const [px, pz] = at(dx, dz);
    props.box(px, y, pz, w, h, d, color, yaw, lit);
  };
  const lamp = (dx: number, dz: number, height = 0.12) => {
    block(dx, height / 2, dz, 0.008, height, 0.008, METAL);
    block(dx, height + 0.006, dz, 0.022, 0.012, 0.022, LAMP_HEAD, true);
  };

  switch (kind) {
    case "billboard":
      for (const dx of [-0.06, 0.06]) block(dx, 0.07, 0, 0.01, 0.14, 0.01, WOOD);
      block(0, 0.165, 0, 0.19, 0.075, 0.01, "#f3ead2");
      block(0, 0.165, 0.006, 0.17, 0.055, 0.002, "#c64032");
      block(-0.04, 0.165, 0.008, 0.05, 0.02, 0.002, "#ffd35b");
      for (const dx of [-0.05, 0.05]) block(dx, 0.215, 0.012, 0.018, 0.008, 0.012, LAMP_HEAD, true);
      break;
    case "overlook":
      block(0, 0.008, 0, 0.14, 0.016, 0.09, WOOD_LIGHT);
      for (const dx of [-0.066, 0.066]) block(dx, 0.04, 0.04, 0.008, 0.05, 0.008, WOOD);
      block(0, 0.062, 0.04, 0.14, 0.006, 0.006, WOOD);
      block(0, 0.03, -0.015, 0.07, 0.01, 0.022, WOOD);
      props.shape(
        new THREE.CylinderGeometry(0.006, 0.006, 0.07, 6),
        METAL,
        point(0.045, 0.05, 0.02),
      );
      props.shape(
        new THREE.CylinderGeometry(0.009, 0.012, 0.045, 8),
        "#3d4a4c",
        point(0.045, 0.09, 0.028),
        new THREE.Euler(Math.PI / 2.4, yaw, 0),
      );
      break;
    case "barn":
      block(0, 0.045, 0, 0.17, 0.09, 0.12, "#a8382c");
      props.shape(gable(0.14, 0.065, 0.19), "#6e4b3a", point(0, 0.09, 0), new THREE.Euler(0, yaw, 0));
      block(0, 0.035, 0.061, 0.05, 0.07, 0.004, "#f1e6cc");
      block(0, 0.035, 0.063, 0.042, 0.062, 0.003, "#7c2b22");
      block(0.05, 0.065, 0.062, 0.02, 0.018, 0.003, "#f6cf73", true);
      props.shape(new THREE.CylinderGeometry(0.035, 0.035, 0.19, 12), "#c9ccc4", point(0.14, 0.095, -0.01));
      props.shape(new THREE.SphereGeometry(0.035, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), "#8e9a97", point(0.14, 0.19, -0.01));
      break;
    case "house":
      block(0, 0.035, 0, 0.11, 0.07, 0.08, "#eadfc8");
      props.shape(gable(0.1, 0.05, 0.13), "#8a5a44", point(0, 0.07, 0), new THREE.Euler(0, yaw, 0));
      block(-0.028, 0.04, 0.041, 0.024, 0.022, 0.003, "#466b73", true);
      block(0.03, 0.028, 0.041, 0.022, 0.05, 0.003, "#7a5a3b");
      block(0.045, 0.02, 0.075, 0.006, 0.04, 0.006, WOOD);
      block(0.045, 0.043, 0.075, 0.016, 0.012, 0.022, "#3f5a78");
      break;
    case "menu-board":
      block(0, 0.03, 0, 0.008, 0.06, 0.008, METAL);
      block(0, 0.07, 0, 0.07, 0.045, 0.01, "#3b3b3b");
      block(0, 0.07, 0.006, 0.06, 0.036, 0.002, "#f6cf73", true);
      block(0.055, 0.025, 0.01, 0.018, 0.05, 0.018, "#bf3a2e");
      break;
    case "picnic":
      block(0, 0.032, 0, 0.09, 0.008, 0.045, WOOD_LIGHT);
      for (const dz of [-0.038, 0.038]) block(0, 0.018, dz, 0.09, 0.006, 0.016, WOOD_LIGHT);
      for (const dx of [-0.035, 0.035]) block(dx, 0.016, 0, 0.008, 0.032, 0.008, WOOD);
      block(0.02, 0.041, -0.005, 0.03, 0.01, 0.02, "#c64032");
      break;
    case "lamp":
      lamp(0, 0);
      break;
  }
}

/** Features that followers can occupy on a tile. */
function features(tile: ITile): ClaimableFeature[] {
  return [
    ...tile.roadConnections.map((_, i) => ({ type: "road" as const, identifier: `road_${i}` })),
    ...tile.costcoZones.map((_, i) => ({ type: "costco" as const, identifier: `costco_${i}` })),
    ...tile.fieldSegments.map((_, i) => ({ type: "field" as const, identifier: `field_${i}` })),
    ...(tile.hasMcDonalds ? [{ type: "mcdonalds" as const }] : []),
  ];
}

/**
 * Why a point cannot hold a landmark of the given radius, or undefined when it
 * is clear of roads, lots, water, the restaurant and every follower spot.
 */
export function landmarkConflict(tile: ITile, point: Point, radius: number): string | undefined {
  const [x, z] = point;
  if (Math.abs(x) + radius > 0.5 || Math.abs(z) + radius > 0.5) return "outside tile";
  for (const connection of tile.roadConnections) {
    if (tileRoadPath(tile, connection).some(([rx, rz]) => Math.hypot(rx - x, rz - z) < ROAD_WIDTH / 2 + radius))
      return "road";
  }
  if (tile.costcoZones.some((_, i) => insidePolygon(point, zonePolygon(tile, i)))) return "costco";
  if (nearRiver(tile, point, radius)) return "river";
  for (const feature of features(tile)) {
    const [ax, az] = featureAnchor(tile, feature);
    if (Math.hypot(ax - x, az - z) < radius + 0.06) return `follower ${feature.type}`;
  }
  if (tile.hasMcDonalds && tile.id !== "mcdonalds-abbey") {
    const [mx, mz] = restaurantPosition(tile);
    if (Math.hypot(mx - x, mz - z) < radius + 0.18) return "restaurant";
  }
  return undefined;
}
