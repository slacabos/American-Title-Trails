import type { Position } from "@/types";
import type { CameraView } from "./cameraView";

export type ArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";
export const isArrowKey = (key: string): key is ArrowKey =>
  key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight";

const WASD: Record<string, ArrowKey> = { w: "ArrowUp", a: "ArrowLeft", s: "ArrowDown", d: "ArrowRight" };

/** The direction an arrow key or its WASD twin points, if it is one. */
export function directionKey(key: string): ArrowKey | undefined {
  return isArrowKey(key) ? key : WASD[key.toLowerCase()];
}

export interface Shortcut {
  /** Keys to show, one line per group of alternatives. */
  keys: string[][];
  /** A key held with every key in `keys`, shown once in front of them. */
  modifier?: string;
  action: string;
}

const DIRECTIONS = [["←", "↑", "→", "↓"], ["W", "A", "S", "D"]];

/** Every shortcut, grouped the way the help screen shows them. */
export const SHORTCUT_GROUPS: { title: string; shortcuts: Shortcut[] }[] = [
  {
    title: "shortcuts.groups.placing",
    shortcuts: [
      { keys: DIRECTIONS, action: "shortcuts.moveCursor" },
      { keys: [["Enter", "Space"]], action: "shortcuts.place" },
      { keys: [["E"]], action: "shortcuts.rotateClockwise" },
      { keys: [["Q"]], action: "shortcuts.rotateCounterClockwise" },
    ],
  },
  {
    title: "shortcuts.groups.claiming",
    shortcuts: [
      { keys: [["↑", "↓", "W", "S"], ["1–9"]], action: "shortcuts.chooseClaim" },
      { keys: [["Enter"]], action: "shortcuts.claim" },
      { keys: [["X"]], action: "shortcuts.skip" },
      { keys: [["U"]], action: "shortcuts.takeBack" },
    ],
  },
  {
    title: "shortcuts.groups.camera",
    shortcuts: [
      { modifier: "Shift", keys: DIRECTIONS, action: "shortcuts.pan" },
      { keys: [["+", "−"]], action: "shortcuts.zoom" },
      { keys: [["F"]], action: "shortcuts.fit" },
      { keys: [["V"]], action: "shortcuts.view" },
    ],
  },
  {
    title: "shortcuts.groups.general",
    shortcuts: [
      { keys: [["N"]], action: "shortcuts.night" },
      { keys: [["M"]], action: "shortcuts.sound" },
      { keys: [["Esc"]], action: "shortcuts.cancel" },
      { keys: [["?"]], action: "shortcuts.help" },
    ],
  },
];

/** Every shortcut in help-screen order. */
export const SHORTCUTS: Shortcut[] = SHORTCUT_GROUPS.flatMap((group) => group.shortcuts);

type Direction = readonly [number, number];
const SQRT_HALF = Math.SQRT1_2;

/**
 * Board-space direction for an arrow key, matching what the player sees. The
 * tabletop camera looks along a 45° diagonal, so screen-up is north-west.
 */
export function arrowDirection(key: ArrowKey, view: CameraView): Direction {
  const up: Direction = view === "drone" ? [0, -1] : [-SQRT_HALF, -SQRT_HALF];
  const right: Direction = view === "drone" ? [1, 0] : [SQRT_HALF, -SQRT_HALF];
  switch (key) {
    case "ArrowUp":
      return up;
    case "ArrowDown":
      return [-up[0], -up[1]];
    case "ArrowRight":
      return right;
    case "ArrowLeft":
      return [-right[0], -right[1]];
  }
}

/**
 * The legal spot to move to from `from` in direction `dir`: the nearest one
 * ahead, where sideways drift counts double. Stays put if nothing is ahead.
 */
export function nextLegal(from: Position, legal: Position[], dir: Direction): Position {
  let best: Position | undefined;
  let bestScore = Infinity;
  for (const spot of legal) {
    const dx = spot.x - from.x;
    const dy = spot.y - from.y;
    const along = dx * dir[0] + dy * dir[1];
    if (along <= 1e-9) continue;
    const sideways = Math.abs(dx * dir[1] - dy * dir[0]);
    const score = along + 2 * sideways;
    if (score < bestScore) {
      bestScore = score;
      best = spot;
    }
  }
  return best ?? from;
}

/** The legal spot nearest `near` (the last placed tile, or the origin). */
export function nearestLegal(legal: Position[], near: Position = { x: 0, y: 0 }): Position | undefined {
  let best: Position | undefined;
  let bestDistance = Infinity;
  for (const spot of legal) {
    const distance = Math.hypot(spot.x - near.x, spot.y - near.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = spot;
    }
  }
  return best;
}

/**
 * Whether a key press belongs to something other than the board entirely:
 * typing in a field, choosing in a dropdown, or anything in an open dialog.
 */
export function isTypingTarget(event: Pick<KeyboardEvent, "target">): boolean {
  if (typeof document !== "undefined" && document.querySelector('[role="dialog"]')) return true;
  const target = event.target;
  if (!(target instanceof Element)) return false;
  return !!target.closest(
    'input, textarea, select, [contenteditable="true"], [role="combobox"], [role="listbox"], [role="option"]',
  );
}

/** Whether Enter/Space should activate the focused control instead of the board. */
export function activatesOnEnter(event: Pick<KeyboardEvent, "target">): boolean {
  const target = event.target;
  return target instanceof Element && !!target.closest('button, a[href], [role="button"], [role="menuitem"]');
}
