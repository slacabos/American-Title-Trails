import * as THREE from "three";

/**
 * Zoom tiers. The orthographic camera's zoom is screen pixels per tile, so
 * each tier drops what has shrunk to a pixel or two:
 * - Full: everything, every mesh casts shadows.
 * - Medium: plants swap to low-poly geometry; fine props stop casting shadows.
 * - Far: fine props and small plants disappear; only large shapes cast shadows.
 */
export enum Lod {
  Full,
  Medium,
  Far,
}

/** Pixels per tile below which each tier starts: Medium, then Far. */
export const LOD_ZOOM: readonly number[] = [64, 32];
/** Zoom must pass a threshold by this fraction before switching back, so a pinch at the boundary never flickers. */
const HYSTERESIS = 0.1;

/** Props whose median dimension is under this, in tile units: posts, rails, arches, road dashes. */
export const FINE_SIZE = 0.02;

/** A canvas-scoped tier that only changes once zoom clearly crosses a threshold. */
export class LodTracker {
  level = Lod.Full;
  private zoom = NaN;

  update(zoom: number): Lod {
    if (zoom === this.zoom) return this.level;
    this.zoom = zoom;
    let level = this.level;
    // Step one tier at a time until the zoom sits inside the current band.
    for (;;) {
      const lower = LOD_ZOOM[level];
      const upper = LOD_ZOOM[level - 1];
      if (lower !== undefined && zoom < lower * (1 - HYSTERESIS)) level++;
      else if (upper !== undefined && zoom > upper * (1 + HYSTERESIS)) level--;
      else break;
    }
    this.level = level;
    return level;
  }
}

/** Whether a prop is thin enough to vanish when zoomed out. */
export function isFine(geometry: THREE.BufferGeometry): boolean {
  geometry.computeBoundingBox();
  const size = geometry.boundingBox!.getSize(new THREE.Vector3());
  const [, median] = [size.x, size.y, size.z].sort((a, b) => a - b);
  return median < FINE_SIZE;
}
