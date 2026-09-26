import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { GROUND_SHADE, groundShade, PaintBatch, place } from "@/rendering/paint";
import { buildSpecies } from "@/rendering/vegetation";

/** Red channel of the vertices at the lowest and highest y. */
function baseAndTop(geometry: THREE.BufferGeometry): [number, number] {
  const position = geometry.getAttribute("position");
  const color = geometry.getAttribute("color");
  let low = 0;
  let high = 0;
  for (let i = 0; i < position.count; i++) {
    if (position.getY(i) < position.getY(low)) low = i;
    if (position.getY(i) > position.getY(high)) high = i;
  }
  return [color.getX(low), color.getX(high)];
}

describe("grounding shade", () => {
  it("darkens a prop where it meets the ground and fades out above", () => {
    expect(groundShade(0)).toBe(GROUND_SHADE);
    expect(groundShade(0.02)).toBeGreaterThan(GROUND_SHADE);
    expect(groundShade(0.2)).toBe(1);
    const batch = new PaintBatch();
    batch.add(place(new THREE.BoxGeometry(0.1, 0.2, 0.1), new THREE.Vector3(0, 0.1, 0)), "#ffffff");
    const [base, top] = baseAndTop(batch.build()!);
    expect(base).toBeCloseTo(GROUND_SHADE);
    expect(top).toBe(1);
  });

  it("leaves the tile's slab below the surface alone", () => {
    expect(groundShade(-0.01)).toBe(1);
    const batch = new PaintBatch();
    batch.add(place(new THREE.BoxGeometry(1, 0.08, 1), new THREE.Vector3(0, -0.05, 0)), "#ffffff");
    expect(baseAndTop(batch.build()!)).toEqual([1, 1]);
  });

  it("keeps existing colours, so plants copied into a ghost are not shaded twice", () => {
    const tree = buildSpecies("round");
    const before = baseAndTop(tree);
    const batch = new PaintBatch();
    batch.add(tree.clone());
    expect(baseAndTop(batch.build()!)).toEqual(before);
  });
});
