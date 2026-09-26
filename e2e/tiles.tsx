import { createRoot } from "react-dom/client";
import { Canvas, _roots } from "@react-three/fiber";
import { MeshStandardMaterial, WebGLRenderTarget } from "three";
import { Daylight, FeatureHighlight, Follower, Scenery, SceneryProvider } from "../src/components/three/Scenery";
import { buildDeck, getStartTile } from "../src/tileLibrary";
import { buildRiverDeck, getRiverSource, getRiverLake } from "../src/riverLibrary";
import { SceneryLibrary } from "../src/rendering/scenery";
import { featureAnchor, type Point } from "../src/rendering/tileLayout";
import { riverPath } from "../src/rendering/riverLayout";
import type { ITile } from "../src/interfaces/ITile";
import type { ClaimableFeature } from "../src/types";

// Four canvases per page keep every tile/rotation readable without exhausting
// the browser's WebGL context limit. This fixture is excluded from production.
const params = new URLSearchParams(location.search);
const page = Number(params.get("page") ?? 0);
const allTiles = [
  ...new Map(
    [getStartTile(), ...buildDeck(), getRiverSource(), ...buildRiverDeck(), getRiverLake()].map((tile) => [
      tile.id,
      tile,
    ]),
  ).values(),
];
const tiles = allTiles.slice(page * 4, page * 4 + 4);
const rotations = [0, 1, 2, 3];
const featureColors = { road: "#d76543", costco: "#437eaf", field: "#8d4dc4", mcdonalds: "#e5b631" };
function features(tile: ITile): ClaimableFeature[] {
  return [
    ...tile.roadConnections.map((_, i) => ({ type: "road" as const, identifier: `road_${i}` })),
    ...tile.costcoZones.map((_, i) => ({ type: "costco" as const, identifier: `costco_${i}` })),
    ...tile.fieldSegments.map((_, i) => ({ type: "field" as const, identifier: `field_${i}` })),
    ...(tile.hasMcDonalds ? [{ type: "mcdonalds" as const }] : []),
  ];
}

/** Read the procedural ground texture at canonical tile coordinates. */
function surfacePixels(id: string, points: Point[]) {
  const library = new SceneryLibrary();
  try {
    const model = library.get(allTiles.find((tile) => tile.id === id)!);
    const material = model.parts
      .map((part) => part.material)
      .find((material) => material instanceof MeshStandardMaterial && material.map) as MeshStandardMaterial;
    const canvas = material.map!.image as HTMLCanvasElement;
    const ctx = canvas.getContext("2d")!;
    return points.map(([x, z]) =>
      Array.from(
        ctx.getImageData(Math.floor((x + 0.5) * canvas.width), Math.floor((z + 0.5) * canvas.height), 1, 1).data,
      ),
    );
  } finally {
    library.dispose();
  }
}

Object.assign(window, {
  tileSceneryTest: {
    markerVisibility: () =>
      Array.from(document.querySelectorAll("canvas")).map((canvas) => {
        const { gl, scene, camera } = _roots.get(canvas)!.store.getState();
        const scenery = scene.getObjectByName("audit-scenery")!;
        const target = new WebGLRenderTarget(canvas.width, canvas.height);
        const previousTarget = gl.getRenderTarget();
        const capture = () => {
          gl.setRenderTarget(target);
          gl.render(scene, camera);
          const pixels = new Uint8Array(canvas.width * canvas.height * 4);
          gl.readRenderTargetPixels(target, 0, 0, canvas.width, canvas.height, pixels);
          return pixels;
        };
        try {
          scenery.visible = false;
          const markers = capture();
          scenery.visible = true;
          const complete = capture();
          let total = 0,
            visible = 0;
          for (let i = 0; i < markers.length; i += 4) {
            // Ignore blended edge pixels; compare the opaque marker silhouette.
            if (markers[i + 3] !== 255) continue;
            total++;
            if ([0, 1, 2].every((channel) => Math.abs(markers[i + channel] - complete[i + channel]) <= 1)) visible++;
          }
          return { total, visible };
        } finally {
          scenery.visible = true;
          gl.setRenderTarget(previousTarget);
          target.dispose();
        }
      }),
    rendered: () =>
      Array.from(document.querySelectorAll("canvas")).every(
        (canvas) => (_roots.get(canvas)?.store.getState().gl.info.render.calls ?? 0) > 0,
      ),
    surfacePixels,
    riverTileIds: () => allTiles.filter((tile) => tile.river).map((tile) => tile.id),
    /** Ground pixels sampled along a river tile's water path. */
    waterPixels: (id: string) => {
      const tile = allTiles.find((candidate) => candidate.id === id)!;
      // Edge points sit on the tile border; the lake is checked at its centre.
      const inside = riverPath(tile).filter(([x, z]) => Math.abs(x) < 0.48 && Math.abs(z) < 0.48);
      return surfacePixels(id, tile.river?.kind === "lake" ? [...inside, [-0.12, -0.04]] : inside);
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <main style={{ width: 1200, color: "#32433e", font: "16px Arial, sans-serif" }}>
    {tiles.map((tile) => (
      <section key={tile.id}>
        <h2 style={{ fontSize: 18, margin: "12px 24px 0" }}>
          {tile.name} · {tile.id}
        </h2>
        <div style={{ height: 240, background: "#f1eee3" }}>
          <Canvas
            orthographic
            shadows="percentage"
            frameloop="demand"
            dpr={1}
            camera={{ position: params.has("top") ? [0, 8, 0] : [0, 6, 4.2], zoom: 190 }}
            onCreated={({ camera }) => {
              camera.up.set(0, 0, -1);
              camera.lookAt(0, 0, 0);
            }}
          >
            <Daylight />
            <group name="audit-scenery">
              <SceneryProvider>
                <Scenery
                  records={rotations.map((rotation) => ({
                    tile: tile.rotate(rotation),
                    position: { x: (rotation - 1.5) * 1.5, y: 0 },
                  }))}
                />
              </SceneryProvider>
              {params.has("occlude") && (
                <group>
                  <mesh position={[0, 0.6, 0]}>
                    <boxGeometry args={[8, 0.4, 2]} />
                    <meshStandardMaterial color="#697660" />
                  </mesh>
                  <mesh position={[0, 0.9, 0]}>
                    <boxGeometry args={[8, 0.1, 2]} />
                    <meshStandardMaterial color="#d4d1ae" transparent opacity={0.5} />
                  </mesh>
                </group>
              )}
            </group>
            {params.has("highlights") &&
              rotations.flatMap((rotation) => {
                const rotated = tile.rotate(rotation);
                // Include stale selections from other tiles and an empty custom zone.
                const selections: ClaimableFeature[] = [
                  ...features(rotated),
                  { type: "costco", identifier: "costco_99" },
                  { type: "costco", identifier: "costco_invalid" },
                  { type: "road", identifier: "road_99" },
                  { type: "field", identifier: "field_99" },
                ];
                return (
                  <group key={rotation}>
                    {selections.map((feature, i) => (
                      <FeatureHighlight key={i} tile={rotated} feature={feature} x={(rotation - 1.5) * 1.5} z={0} />
                    ))}
                    <FeatureHighlight
                      tile={{ ...rotated, costcoZones: [{ id: "empty", segments: [] }] }}
                      feature={{ type: "costco", identifier: "costco_0" }}
                      x={(rotation - 1.5) * 1.5}
                      z={0}
                    />
                  </group>
                );
              })}
            {params.has("markers") &&
              rotations.flatMap((rotation) => {
                const rotated = tile.rotate(rotation);
                return features(rotated).map((feature) => {
                  const [x, z] = featureAnchor(rotated, feature);
                  return (
                    <Follower
                      key={`${rotation}-${feature.type}-${feature.identifier}`}
                      point={[(rotation - 1.5) * 1.5 + x, feature.type === "mcdonalds" ? 0.16 : 0.012, z]}
                      color={featureColors[feature.type]}
                      farmer={feature.type === "field"}
                    />
                  );
                });
              })}
          </Canvas>
        </div>
        <div style={{ display: "flex", justifyContent: "space-evenly", marginBottom: 18 }}>
          {rotations.map((rotation) => (
            <span key={rotation}>{rotation * 90}°</span>
          ))}
        </div>
      </section>
    ))}
  </main>,
);
