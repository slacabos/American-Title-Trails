import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { AT_REST, LANDING_MS, landingMatrix, landingPose } from "@/rendering/landing";

const samples = Array.from({ length: 201 }, (_, i) => i / 200);

describe("landing pose", () => {
  it("starts lifted above the table and ends exactly at rest", () => {
    expect(landingPose(0).lift).toBeCloseTo(0.6);
    expect(landingPose(1)).toEqual(AT_REST);
    expect(landingPose(1.5)).toEqual(AT_REST);
    expect(LANDING_MS).toBeGreaterThan(300);
    expect(LANDING_MS).toBeLessThan(700);
  });

  it("falls monotonically, then never dips below the table", () => {
    const fall = samples.filter((t) => t <= 0.55).map((t) => landingPose(t).lift);
    for (let i = 1; i < fall.length; i++) expect(fall[i]).toBeLessThanOrEqual(fall[i - 1]);
    for (const t of samples) expect(landingPose(t).lift).toBeGreaterThanOrEqual(0);
  });

  it("squashes gently on impact and stays near its true size", () => {
    const squashes = samples.map((t) => landingPose(t).squash);
    expect(Math.min(...squashes)).toBeCloseTo(0.9, 2);
    expect(Math.max(...squashes)).toBeLessThan(1.05);
    for (const t of samples) {
      const { squash, spread } = landingPose(t);
      // Squashing flatter spreads a little wider.
      if (squash < 1) expect(spread).toBeGreaterThan(1);
    }
  });

  it("raises dust only after impact, fading as the tile settles", () => {
    expect(landingPose(0.3).dustOpacity).toBe(0);
    expect(landingPose(0.56).dustOpacity).toBeGreaterThan(0.5);
    expect(landingPose(0.95).dustOpacity).toBeLessThan(0.1);
    expect(landingPose(0.95).dustScale).toBeGreaterThan(landingPose(0.6).dustScale);
  });
});

describe("landing matrix", () => {
  const base = new THREE.Matrix4().makeRotationY(Math.PI / 2).setPosition(3, 0, -2);
  const center = { x: 3, y: -2 };

  it("leaves the matrix unchanged at rest", () => {
    expect(landingMatrix(base, center, AT_REST).equals(base)).toBe(true);
  });

  it("lifts and scales about the tile centre", () => {
    const pose = { ...AT_REST, lift: 0.5, squash: 0.5, spread: 2 };
    const moved = landingMatrix(base, center, pose);
    const centre = new THREE.Vector3(0, 0, 0).applyMatrix4(moved);
    expect(centre.toArray().map((v) => +v.toFixed(6))).toEqual([3, 0.5, -2]);
    const roofCorner = new THREE.Vector3(0.5, 0.2, 0.5).applyMatrix4(moved);
    expect(roofCorner.y).toBeCloseTo(0.5 + 0.2 * 0.5);
    expect(Math.hypot(roofCorner.x - 3, roofCorner.z + 2)).toBeCloseTo(Math.SQRT2);
  });
});
