import * as THREE from "three";
import type { CameraView } from "./cameraView";

export interface ViewPose {
  /** Unit vector from the look target towards the camera. */
  direction: THREE.Vector3;
  /** Which world direction appears at the top of the screen. */
  up: THREE.Vector3;
}

/** The tabletop looks along a fixed 45° diagonal from 50° above the table. */
const TABLETOP_DIRECTION = new THREE.Vector3(1, Math.tan((50 * Math.PI) / 180) * Math.SQRT2, 1).normalize();

export const VIEW_POSES: Record<CameraView, ViewPose> = {
  tabletop: { direction: TABLETOP_DIRECTION, up: new THREE.Vector3(0, 1, 0) },
  // Straight down, with north (negative Z) at the top of the screen.
  drone: { direction: new THREE.Vector3(0, 1, 0), up: new THREE.Vector3(0, 0, -1) },
};

/** Distance from the look target; orthographic, so it only affects clipping. */
export const CAMERA_DISTANCE = 30;
export const VIEW_TRANSITION_MS = 350;

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** The camera pose part-way between two views, t in [0, 1]. */
export function blendPose(from: ViewPose, to: ViewPose, t: number): ViewPose {
  const k = ease(Math.min(1, Math.max(0, t)));
  return {
    direction: from.direction.clone().lerp(to.direction, k).normalize(),
    up: from.up.clone().lerp(to.up, k).normalize(),
  };
}

/** Point a camera at `target` from the given pose. */
export function applyPose(camera: THREE.Camera, target: THREE.Vector3, pose: ViewPose): void {
  camera.up.copy(pose.up);
  camera.position.copy(target).addScaledVector(pose.direction, CAMERA_DISTANCE);
  camera.lookAt(target);
  camera.updateMatrixWorld();
}
