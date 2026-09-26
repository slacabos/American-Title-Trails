import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/** How much lighter a prop's base is than its top: 1 means no darkening. */
export const GROUND_SHADE = 0.74;
/** Height, in tile units, over which a prop climbs out of its grounding shade. */
const SHADE_HEIGHT = 0.045;

/**
 * Baked ambient occlusion: props darken where they meet the ground, so they sit
 * on the tile instead of floating. The tile's own slab, below the surface, keeps
 * its colour.
 */
export function groundShade(y: number): number {
  if (y < -0.001) return 1;
  const t = Math.min(1, y / SHADE_HEIGHT);
  return GROUND_SHADE + (1 - GROUND_SHADE) * t * t * (3 - 2 * t);
}

/**
 * Solid-coloured props merge into one vertex-coloured mesh per tile type, so
 * adding a prop or a colour never adds a draw call.
 */
export class PaintBatch {
  private geometries: THREE.BufferGeometry[] = [];

  /**
   * Omit `color` to keep a geometry's existing vertex colours, including their
   * grounding shade. Positions must already be in tile space, with the surface
   * at y = 0.
   */
  add(geometry: THREE.BufferGeometry, color?: string): void {
    // Mixed indexed (boxes) and non-indexed (icosahedra) geometry cannot merge.
    const flat = geometry.index ? geometry.toNonIndexed() : geometry;
    if (flat !== geometry) geometry.dispose();
    if (!flat.getAttribute("uv")) {
      flat.setAttribute(
        "uv",
        new THREE.Float32BufferAttribute(new Float32Array(flat.getAttribute("position").count * 2), 2),
      );
    }
    if (!color && flat.getAttribute("color")) {
      this.geometries.push(flat);
      return;
    }
    const tint = new THREE.Color(color ?? "#ffffff");
    const position = flat.getAttribute("position");
    const colors = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i++) {
      const shade = groundShade(position.getY(i));
      colors[i * 3] = tint.r * shade;
      colors[i * 3 + 1] = tint.g * shade;
      colors[i * 3 + 2] = tint.b * shade;
    }
    flat.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    this.geometries.push(flat);
  }

  /** Merge everything added so far; returns null when the batch is empty. */
  build(): THREE.BufferGeometry | null {
    if (this.geometries.length === 0) return null;
    const merged = mergeGeometries(this.geometries);
    this.geometries.forEach((geometry) => geometry.dispose());
    this.geometries = [];
    return merged;
  }
}

/** Places a geometry at a position/rotation in tile space. */
export function place(
  geometry: THREE.BufferGeometry,
  position: THREE.Vector3,
  rotation = new THREE.Euler(),
  scale = 1,
): THREE.BufferGeometry {
  return geometry.applyMatrix4(
    new THREE.Matrix4().compose(
      position,
      new THREE.Quaternion().setFromEuler(rotation),
      new THREE.Vector3(scale, scale, scale),
    ),
  );
}

/** The drawing surface landmark builders use: boxes and arbitrary shapes in tile space. */
export interface PropBuilder {
  box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: string,
    yaw?: number,
    lit?: boolean,
  ): void;
  shape(
    geometry: THREE.BufferGeometry,
    color: string,
    position: THREE.Vector3,
    rotation?: THREE.Euler,
    lit?: boolean,
  ): void;
}

export const GLOW_COLOR = "#ffc86e";
