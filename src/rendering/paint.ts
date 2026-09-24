import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Solid-coloured props merge into one vertex-coloured mesh per tile type, so
 * adding a prop or a colour never adds a draw call.
 */
export class PaintBatch {
  private geometries: THREE.BufferGeometry[] = [];

  add(geometry: THREE.BufferGeometry, color: string): void {
    // Mixed indexed (boxes) and non-indexed (icosahedra) geometry cannot merge.
    const flat = geometry.index ? geometry.toNonIndexed() : geometry;
    if (flat !== geometry) geometry.dispose();
    if (!flat.getAttribute("uv")) {
      flat.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(flat.getAttribute("position").count * 2), 2));
    }
    const tint = new THREE.Color(color);
    const colors = new Float32Array(flat.getAttribute("position").count * 3);
    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = tint.r;
      colors[i + 1] = tint.g;
      colors[i + 2] = tint.b;
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
  box(x: number, y: number, z: number, w: number, h: number, d: number, color: string, yaw?: number, lit?: boolean): void;
  shape(geometry: THREE.BufferGeometry, color: string, position: THREE.Vector3, rotation?: THREE.Euler, lit?: boolean): void;
}

export const GLOW_COLOR = "#ffc86e";
