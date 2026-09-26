import * as THREE from "three";
import { LANDING_FALL as FALL } from "./landingTiming";

export { LANDING_MS, prefersReducedMotion } from "./landingTiming";
const DROP_HEIGHT = 0.6;

export interface LandingPose {
  /** Height above the table. */
  lift: number;
  /** Vertical scale (1 = rest). */
  squash: number;
  /** Horizontal scale (1 = rest), bulging a little as the tile squashes. */
  spread: number;
  /** Dust ring scale relative to the tile, and its opacity. */
  dustScale: number;
  dustOpacity: number;
}

export const AT_REST: LandingPose = { lift: 0, squash: 1, spread: 1, dustScale: 1, dustOpacity: 0 };

/** The tile's pose at `t` (0 = start of the fall, 1 = settled). */
export function landingPose(t: number): LandingPose {
  if (t >= 1) return AT_REST;
  if (t <= FALL) {
    // Ease in: the tile accelerates towards the table.
    const p = Math.max(0, t) / FALL;
    return { lift: DROP_HEIGHT * (1 - p * p), squash: 1, spread: 1, dustScale: 0.6, dustOpacity: 0 };
  }
  const q = (t - FALL) / (1 - FALL);
  // A damped wobble: squashed to 0.9 on impact, a small overshoot, then rest.
  const squash = 1 - 0.1 * (1 - q) ** 2 * Math.cos(2.5 * Math.PI * q);
  return {
    lift: 0.035 * Math.sin(Math.PI * q) * (1 - q),
    squash,
    spread: 1 + (1 - squash) * 0.4,
    dustScale: 0.6 + 0.9 * (1 - (1 - q) ** 2),
    dustOpacity: 0.55 * (1 - q),
  };
}

/** Apply a pose to a world matrix, scaling about the tile centre on the table. */
export function landingMatrix(
  base: THREE.Matrix4,
  center: { x: number; y: number },
  pose: LandingPose,
  out = new THREE.Matrix4(),
): THREE.Matrix4 {
  const toCenter = new THREE.Matrix4().makeTranslation(-center.x, 0, -center.y);
  const scale = new THREE.Matrix4().makeScale(pose.spread, pose.squash, pose.spread);
  const back = new THREE.Matrix4().makeTranslation(center.x, pose.lift, center.y);
  return out.copy(back).multiply(scale).multiply(toCenter).multiply(base);
}

/** What is landing this frame, shared by every mesh that draws the tile. */
export interface LandingFrame {
  key: string;
  center: { x: number; y: number };
  pose: LandingPose;
}
