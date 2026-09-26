import * as THREE from "three";
import type { RegionWeights } from "./regions";

/** Per-instance corner weights (farmland, forest, desert); meadow is the rest. */
export const REGION_ATTRIBUTES = ["regionNW", "regionNE", "regionSW", "regionSE"] as const;

const GRASS = new THREE.Color("#83a365");
/** Linear-space multipliers that turn the base grass into each landscape. */
const tint = (target: string) => {
  const color = new THREE.Color(target);
  return new THREE.Vector3(color.r / GRASS.r, color.g / GRASS.g, color.b / GRASS.b);
};

const VERTEX_HEAD = /* glsl */ `
attribute vec3 regionNW;
attribute vec3 regionNE;
attribute vec3 regionSW;
attribute vec3 regionSE;
varying vec3 vRegion;
varying vec2 vRegionWorld;
`;

const VERTEX_BODY = /* glsl */ `
vec2 regionT = position.xz + 0.5;
vRegion = mix(mix(regionNW, regionNE, regionT.x), mix(regionSW, regionSE, regionT.x), regionT.y);
#ifdef USE_INSTANCING
vRegionWorld = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xz;
#else
vRegionWorld = (modelMatrix * vec4(position, 1.0)).xz;
#endif
`;

const FRAGMENT_HEAD = /* glsl */ `
uniform sampler2D regionMask;
uniform vec3 farmTint;
uniform vec3 forestTint;
uniform vec3 desertTint;
varying vec3 vRegion;
varying vec2 vRegionWorld;
`;

const FRAGMENT_BODY = /* glsl */ `
float grass = texture2D(regionMask, vMapUv).r;
float meadowWeight = clamp(1.0 - vRegion.x - vRegion.y - vRegion.z, 0.0, 1.0);
// Crop rows run north-south across farmland; desert sand gets a fine speckle.
float rows = 0.86 + 0.14 * smoothstep(0.15, 0.45, abs(fract(vRegionWorld.x * 7.0) - 0.5));
float speck = fract(sin(dot(floor(vRegionWorld * 48.0), vec2(12.9898, 78.233))) * 43758.5453);
vec3 landscape = meadowWeight * vec3(1.0)
  + vRegion.x * farmTint * rows
  + vRegion.y * forestTint
  + vRegion.z * desertTint * (0.93 + 0.14 * speck);
diffuseColor.rgb *= mix(vec3(1.0), landscape, grass);
`;

/**
 * Let a tile type's ground take on the regional landscape wherever the mask
 * is white. Instances without region attributes read zeros, which is meadow.
 */
export function makeRegional(material: THREE.MeshStandardMaterial, mask: THREE.Texture): void {
  material.userData.regional = true;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.regionMask = { value: mask };
    shader.uniforms.farmTint = { value: tint("#c9b872") };
    shader.uniforms.forestTint = { value: tint("#5a7f4c") };
    shader.uniforms.desertTint = { value: tint("#dcc294") };
    shader.vertexShader =
      VERTEX_HEAD + shader.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>\n${VERTEX_BODY}`);
    shader.fragmentShader =
      FRAGMENT_HEAD +
      shader.fragmentShader.replace("#include <map_fragment>", `#include <map_fragment>\n${FRAGMENT_BODY}`);
  };
}

/** Write each instance's corner weights onto the shared ground geometry. */
export function writeRegionAttributes(geometry: THREE.BufferGeometry, corners: RegionWeights[][]): void {
  REGION_ATTRIBUTES.forEach((name, corner) => {
    const values = new Float32Array(corners.length * 3);
    corners.forEach((weights, i) => {
      values[i * 3] = weights[corner].farmland;
      values[i * 3 + 1] = weights[corner].forest;
      values[i * 3 + 2] = weights[corner].desert;
    });
    geometry.setAttribute(name, new THREE.InstancedBufferAttribute(values, 3));
  });
}
