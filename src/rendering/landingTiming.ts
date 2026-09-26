// Timing only, without three.js, so the HUD can sync to a landing cheaply.

/** A placed tile drops in, squashes on impact and settles in this long. */
export const LANDING_MS = 480;
/** Share of the landing spent falling; the rest is the squash and settle. */
export const LANDING_FALL = 0.55;
/** When the falling tile hits the table. */
export const LANDING_IMPACT_MS = LANDING_MS * LANDING_FALL;

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
