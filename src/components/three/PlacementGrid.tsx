import { useMemo } from "react";
import { Color, Vector2 } from "three";
import type { Bounds } from "@/types";

const vertexShader = /* glsl */ `
  varying vec2 boardPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    boardPosition = worldPosition.xz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec2 boardCenter;
  uniform vec2 boardHalfSize;
  uniform vec3 lineColor;
  varying vec2 boardPosition;

  void main() {
    // Tile centers are integers, so cell boundaries fall at half units.
    // Screen-space derivatives keep the lines fine and smooth at every zoom.
    vec2 distanceToLine = abs(fract(boardPosition) - 0.5);
    vec2 lineWidth = max(fwidth(boardPosition), vec2(0.0001));
    vec2 grid = distanceToLine / lineWidth;
    float line = 1.0 - min(min(grid.x, grid.y), 1.0);

    vec2 outsideBoard = max(abs(boardPosition - boardCenter) - boardHalfSize, 0.0);
    float fade = 1.0 - smoothstep(0.5, 3.5, length(outsideBoard));
    float alpha = line * fade * 0.24;
    if (alpha < 0.001) discard;
    gl_FragColor = vec4(lineColor, alpha);
    #include <colorspace_fragment>
  }
`;

/** A single, non-interactive grid that fades beyond the growing board. */
export function PlacementGrid({ bounds }: { bounds: Bounds }) {
  const { minX, minY, maxX, maxY } = bounds;
  const centerX = (minX + maxX) / 2;
  const centerZ = (minY + maxY) / 2;
  const uniforms = useMemo(
    () => ({
      boardCenter: { value: new Vector2(centerX, centerZ) },
      boardHalfSize: {
        value: new Vector2((maxX - minX + 1) / 2, (maxY - minY + 1) / 2),
      },
      lineColor: { value: new Color("#75816b") },
    }),
    [centerX, centerZ, minX, minY, maxX, maxY],
  );

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, -0.093, centerZ]}>
      <planeGeometry args={[maxX - minX + 9, maxY - minY + 9]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
