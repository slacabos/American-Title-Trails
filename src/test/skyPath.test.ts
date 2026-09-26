import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { gameProgress, SKY_ELEVATION, skyPose } from "@/rendering/skyPath";

const elevation = (progress: number, night = false) =>
  THREE.MathUtils.radToDeg(Math.asin(skyPose(progress, night).direction.y));

describe("sky path", () => {
  it("rises in the east, crosses the south at midday and sets in the west", () => {
    expect(skyPose(0).direction.x).toBeGreaterThan(0.5);
    expect(skyPose(0.5).direction.z).toBeGreaterThan(0.4);
    expect(skyPose(1).direction.x).toBeLessThan(-0.5);
    const east = [0, 0.25, 0.5, 0.75, 1].map((progress) => skyPose(progress).direction.x);
    east.slice(1).forEach((x, i) => expect(x).toBeLessThan(east[i]));
  });

  it("is highest at midday and never drops below the minimum", () => {
    expect(elevation(0.5)).toBeCloseTo(SKY_ELEVATION.day.high);
    for (const progress of [0, 0.1, 0.9, 1]) {
      expect(elevation(progress)).toBeGreaterThanOrEqual(SKY_ELEVATION.day.low - 1e-6);
      expect(elevation(progress)).toBeLessThan(elevation(0.5));
    }
  });

  it("clamps progress outside the game and treats nonsense as midday", () => {
    expect(skyPose(-1).direction.equals(skyPose(0).direction)).toBe(true);
    expect(skyPose(2).direction.equals(skyPose(1).direction)).toBe(true);
    expect(skyPose(NaN).direction.equals(skyPose(0.5).direction)).toBe(true);
  });

  it("warms towards golden hour", () => {
    const coolness = (progress: number) => skyPose(progress).color.b / skyPose(progress).color.r;
    expect(coolness(1)).toBeLessThan(coolness(0.5));
  });

  it("gives the moon a lower, dimmer and cooler light than the sun", () => {
    for (const progress of [0, 0.5, 1]) {
      const sun = skyPose(progress);
      const moon = skyPose(progress, true);
      expect(moon.intensity).toBeLessThan(sun.intensity);
      expect(moon.color.b).toBeGreaterThan(moon.color.r);
    }
    expect(elevation(0.5, true)).toBeLessThan(elevation(0.5));
  });

  it("measures progress through the deck", () => {
    expect(gameProgress(1, 62)).toBeCloseTo(1 / 63);
    expect(gameProgress(63, 0)).toBe(1);
    expect(gameProgress(0, 0)).toBe(0);
  });
});
