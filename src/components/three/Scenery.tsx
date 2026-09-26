import { tileRoadPath } from "@/rendering/riverLayout";
import React, { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { warehouseLayout, warehouseLayoutKey } from "@/rendering/warehouseLayout";
import type { ITile } from "@/interfaces/ITile";
import type { ClaimableFeature, TileRecord } from "@/types";
import { SceneryLibrary, SceneryPart } from "@/rendering/scenery";
import { cornerWeights } from "@/rendering/regions";
import { writeRegionAttributes } from "@/rendering/groundShader";
import { type PlantInstances, plantInstances, SMALL_SPECIES } from "@/rendering/vegetation";
import { Lod } from "@/rendering/lod";
import { skyPose } from "@/rendering/skyPath";
import { AT_REST, landingMatrix, type LandingFrame } from "@/rendering/landing";
import {
  canonicalTile,
  CORNERS,
  featureAnchor,
  Point,
  positionKey,
  sceneryKey,
  zonePolygon,
} from "@/rendering/tileLayout";

const LibraryContext = createContext<SceneryLibrary | null>(null);

export function SceneryProvider({ children }: { children: React.ReactNode }) {
  const [library] = useState(() => new SceneryLibrary());
  useEffect(() => () => library.dispose(), [library]);
  return <LibraryContext.Provider value={library}>{children}</LibraryContext.Provider>;
}

/** Where a tile instance rests: rotated about its centre, then placed. */
function restingMatrix({ position, tile }: TileRecord, out = new THREE.Matrix4()) {
  out.makeRotationY((-tile.orientation * Math.PI) / 2);
  return out.setPosition(position.x, 0, position.y);
}

/**
 * Keep one instanced mesh's landing instances in step with the landing
 * frame, and put them back at rest when it ends. Returns whether any changed.
 */
function useLandingInstances(
  landing: React.RefObject<LandingFrame | null> | undefined,
  owners: string[],
  rest: (index: number, out: THREE.Matrix4) => THREE.Matrix4,
) {
  const moving = useRef<number[]>([]);
  const scratch = useMemo(() => ({ base: new THREE.Matrix4(), out: new THREE.Matrix4() }), []);
  return (mesh: THREE.InstancedMesh) => {
    const frame = landing?.current;
    const indices = frame ? owners.flatMap((owner, i) => (owner === frame.key ? [i] : [])) : [];
    if (!indices.length && !moving.current.length) return;
    const started = indices.length > 0 && moving.current.length === 0;
    for (const i of moving.current)
      if (!indices.includes(i) && i < owners.length) mesh.setMatrixAt(i, rest(i, scratch.base));
    for (const i of indices)
      mesh.setMatrixAt(i, landingMatrix(rest(i, scratch.base), frame!.center, frame!.pose, scratch.out));
    mesh.instanceMatrix.needsUpdate = true;
    // Refresh the culling bounds as the tile starts high and when it has landed.
    if (started || !indices.length) mesh.computeBoundingSphere();
    moving.current = indices;
  };
}

function Instances({
  part,
  records,
  seed,
  landing,
}: {
  part: SceneryPart;
  records: TileRecord[];
  seed?: number;
  landing?: React.RefObject<LandingFrame | null>;
}) {
  const library = useContext(LibraryContext)!;
  const ref = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((state) => state.invalidate);
  const owners = useMemo(() => records.map(({ position }) => positionKey(position)), [records]);
  const animate = useLandingInstances(landing, owners, (i, out) => restingMatrix(records[i], out));
  // Runs before each demand frame, so a zoom change and its tier share a frame.
  useFrame(({ camera }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const lod = library.lod.update(camera.zoom);
    mesh.visible = !part.fine || lod !== Lod.Far;
    mesh.castShadow = part.glowOnly ? false : part.fine ? lod === Lod.Full : true;
    animate(mesh);
  });
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    if (part.material.userData.regional) {
      writeRegionAttributes(
        part.geometry,
        records.map(({ position, tile }) => cornerWeights(position, tile.orientation, seed)),
      );
    }
    const matrix = new THREE.Matrix4();
    records.forEach((record, index) => mesh.setMatrixAt(index, restingMatrix(record, matrix)));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    // Instance matrices change outside React's mesh props. Demand rendering
    // needs an explicit frame when an existing tile moves or rotates.
    invalidate();
  }, [records, invalidate, part, seed]);
  // R3F disposes each instance buffer. Geometry/material arguments belong to the
  // library and are not declaratively attached children, so they stay shared.
  return <instancedMesh ref={ref} args={[part.geometry, part.material, records.length]} castShadow receiveShadow />;
}

function PlantMesh({ plants, landing }: { plants: PlantInstances; landing?: React.RefObject<LandingFrame | null> }) {
  const library = useContext(LibraryContext)!;
  const ref = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((state) => state.invalidate);
  const animate = useLandingInstances(landing, plants.owners, (i, out) => out.copy(plants.matrices[i]));
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    plants.matrices.forEach((matrix, i) => {
      mesh.setMatrixAt(i, matrix);
      mesh.setColorAt(i, plants.colors[i]);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
    invalidate();
  }, [plants, invalidate]);
  useFrame(({ camera }) => {
    const mesh = ref.current;
    if (!mesh) return;
    const lod = library.lod.update(camera.zoom);
    mesh.geometry = library.getSpecies(plants.species, lod !== Lod.Full);
    mesh.visible = lod !== Lod.Far || !SMALL_SPECIES.has(plants.species);
    mesh.castShadow = lod !== Lod.Far;
    animate(mesh);
  });
  return (
    <instancedMesh
      ref={ref}
      args={[library.getSpecies(plants.species), library.paintMaterial(), plants.matrices.length]}
      castShadow
      receiveShadow
    />
  );
}

/** One draw per plant species, however many tiles are on the board. */
export function Vegetation({
  records,
  seed,
  landing,
}: {
  records: TileRecord[];
  seed?: number;
  landing?: React.RefObject<LandingFrame | null>;
}) {
  const groups = useMemo(() => plantInstances(records, seed), [records, seed]);
  return (
    <>
      {groups.map((plants) => (
        <PlantMesh key={`${plants.species}-${plants.matrices.length}`} plants={plants} landing={landing} />
      ))}
    </>
  );
}

/** One draw per material and tile type, regardless of how many copies are on the board. */
export function Scenery({
  records,
  seed,
  landing,
  landingKey,
}: {
  records: TileRecord[];
  seed?: number;
  /** The pose of the tile landing this frame, written by the scene's driver. */
  landing?: React.RefObject<LandingFrame | null>;
  /** The position key of the landing tile, while it lands. */
  landingKey?: string;
}) {
  const library = useContext(LibraryContext)!;
  const groups = useMemo(() => {
    const result = new Map<string, TileRecord[]>();
    records.forEach((record) => {
      const key = sceneryKey(record.tile);
      const list = result.get(key) ?? [];
      list.push(record);
      result.set(key, list);
    });
    return [...result.entries()];
  }, [records]);
  return (
    <>
      {groups.map(([key, tiles]) => (
        <group key={key}>
          {library.get(tiles[0].tile).parts.map((part, i) => (
            <Instances key={`${i}-${tiles.length}`} part={part} records={tiles} seed={seed} landing={landing} />
          ))}
        </group>
      ))}
      <Warehouses records={records} landing={landing} landingKey={landingKey} />
      <Vegetation records={records} seed={seed} landing={landing} />
    </>
  );
}

function Warehouses({
  records,
  landing,
  landingKey,
}: {
  records: TileRecord[];
  landing?: React.RefObject<LandingFrame | null>;
  landingKey?: string;
}) {
  // Joined warehouses are one board-wide mesh. A landing Costco tile falls as
  // its own section and joins the rest once it has landed.
  const lander = landingKey ? records.find(({ position }) => positionKey(position) === landingKey) : undefined;
  const settled = lander ? records.filter((record) => record !== lander) : records;
  return (
    <>
      <WarehouseModel key={warehouseLayoutKey(settled)} records={settled} />
      {lander && lander.tile.costcoZones.length > 0 && landing && (
        <LandingWarehouse record={lander} landing={landing} />
      )}
    </>
  );
}

function LandingWarehouse({ record, landing }: { record: TileRecord; landing: React.RefObject<LandingFrame | null> }) {
  const library = useContext(LibraryContext)!;
  const group = useRef<THREE.Group>(null);
  const key = positionKey(record.position);
  const [model] = useState(() =>
    library.createWarehouses(warehouseLayout([{ tile: canonicalTile(record.tile), position: { x: 0, y: 0 } }])),
  );
  useEffect(() => () => model.parts.forEach((part) => part.geometry.dispose()), [model]);
  useFrame(() => {
    const node = group.current;
    if (!node) return;
    const pose = landing.current?.key === key ? landing.current.pose : AT_REST;
    node.position.set(record.position.x, pose.lift, record.position.y);
    node.scale.set(pose.spread, pose.squash, pose.spread);
  });
  return (
    <group
      ref={group}
      dispose={null}
      name="landing-warehouse"
      position={[record.position.x, 0, record.position.y]}
      rotation={[0, (-record.tile.orientation * Math.PI) / 2, 0]}
    >
      {model.parts.map((part, i) => (
        <mesh key={i} geometry={part.geometry} material={part.material} castShadow receiveShadow />
      ))}
    </group>
  );
}

/** A ring of dust that spreads from the tile as it lands. */
export function LandingDust({
  landing,
  night = false,
}: {
  landing: React.RefObject<LandingFrame | null>;
  night?: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    const ring = mesh.current;
    if (!ring || !material.current) return;
    const frame = landing.current;
    ring.visible = !!frame && frame.pose.dustOpacity > 0;
    if (!frame || !ring.visible) return;
    ring.position.set(frame.center.x, 0.012, frame.center.y);
    ring.scale.setScalar(frame.pose.dustScale);
    material.current.opacity = frame.pose.dustOpacity;
  });
  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} visible={false} name="landing-dust" renderOrder={2}>
      <ringGeometry args={[0.46, 0.66, 48]} />
      <meshBasicMaterial
        ref={material}
        color={night ? "#5d675f" : "#efe6c9"}
        transparent
        opacity={0}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

function WarehouseModel({ records }: { records: TileRecord[] }) {
  const library = useContext(LibraryContext)!;
  // The parent key changes only when placed warehouse topology changes.
  const [model] = useState(() => library.createWarehouses(warehouseLayout(records)));
  useEffect(() => () => model.parts.forEach((part) => part.geometry.dispose()), [model]);
  return (
    <group dispose={null} name="connected-warehouses">
      {model.parts.map((part, i) => (
        <mesh key={i} geometry={part.geometry} material={part.material} castShadow receiveShadow />
      ))}
    </group>
  );
}

export function GhostTile({ tile, x, z }: { tile: ITile; x: number; z: number }) {
  const library = useContext(LibraryContext)!;
  const model = library.getGhost(tile);
  const materials = useMemo(
    () =>
      model.parts.map((part) => {
        const material = part.material.clone();
        material.transparent = true;
        material.opacity = 0.48;
        material.depthWrite = false;
        return material;
      }),
    [model],
  );
  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials]);
  return (
    <group position={[x, 0.018, z]} rotation={[0, (-tile.orientation * Math.PI) / 2, 0]} dispose={null}>
      {model.parts.map((part, i) => (
        <mesh key={i} geometry={part.geometry} material={materials[i]} />
      ))}
    </group>
  );
}

export function Follower({
  point,
  color,
  farmer = false,
}: {
  point: [number, number, number];
  color: string;
  farmer?: boolean;
}) {
  // Claims are a gameplay overlay: draw after scenery (including transparent
  // previews), without letting roofs or trees hide their silhouette. Keep
  // depth writes off so the marker cannot occlude other scene overlays.
  const overlay = { transparent: true, depthTest: false, depthWrite: false };
  return (
    <group position={point}>
      <mesh renderOrder={1000} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.007, 0]}>
        <ringGeometry args={[0.07, 0.085, 20]} />
        <meshBasicMaterial color="#fff6da" {...overlay} />
      </mesh>
      <group rotation={[0, 0, farmer ? Math.PI / 2 : 0]} position={[farmer ? 0.065 : 0, farmer ? 0.048 : 0.015, 0]}>
        <mesh renderOrder={1000} position={[0, 0.035, 0]}>
          <cylinderGeometry args={[0.027, 0.048, 0.07, 10]} />
          <meshStandardMaterial color={color} roughness={0.5} {...overlay} />
        </mesh>
        <mesh renderOrder={1000} position={[0, 0.098, 0]}>
          <sphereGeometry args={[0.034, 12, 8]} />
          <meshStandardMaterial color={color} roughness={0.5} {...overlay} />
        </mesh>
      </group>
    </group>
  );
}

export function CellOutline({
  x,
  z,
  color = "#6a8d63",
  fill = false,
}: {
  x: number;
  z: number;
  color?: string;
  fill?: boolean;
}) {
  return (
    <group name={fill ? "legal-placement" : "tile-outline"} position={[x, 0.01, z]}>
      {fill && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.96, 0.96]} />
          <meshBasicMaterial color={color} transparent opacity={0.22} depthWrite={false} />
        </mesh>
      )}
      {[0, 1, 2, 3].map((edge) => (
        <mesh
          key={edge}
          position={[edge === 1 ? 0.485 : edge === 3 ? -0.485 : 0, 0.003, edge === 0 ? -0.485 : edge === 2 ? 0.485 : 0]}
        >
          <boxGeometry args={edge % 2 ? [0.013, 0.008, 0.97] : [0.97, 0.008, 0.013]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  );
}

function HighlightPolygon({ points }: { points: Point[] }) {
  const geometry = useMemo(() => {
    // Three's Shape constructor reads points[0], even for an empty array.
    if (points.length < 3) return null;
    const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)));
    return new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2);
  }, [points]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  return (
    <mesh geometry={geometry} position={[0, 0.008, 0]}>
      <meshBasicMaterial color="#ffde79" transparent opacity={0.55} depthWrite={false} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function FeatureHighlight({
  tile,
  feature,
  x,
  z,
}: {
  tile: ITile;
  feature: ClaimableFeature;
  x: number;
  z: number;
}) {
  const index = Number(feature.identifier?.split("_")[1] ?? 0);
  // A stale selection can refer to a zone on the previous tile. Ignore it
  // rather than drawing a phantom highlight or failing the whole 3D canvas.
  if (
    (feature.type === "costco" && !tile.costcoZones[index]) ||
    (feature.type === "road" && !tile.roadConnections[index]) ||
    (feature.type === "field" && !tile.fieldSegments[index]) ||
    (feature.type === "mcdonalds" && !tile.hasMcDonalds)
  )
    return null;
  const anchor = featureAnchor(tile, feature);
  return (
    <group position={[x, 0.004, z]}>
      {feature.type === "costco" && <HighlightPolygon points={zonePolygon(tile, index)} />}
      {feature.type === "road" &&
        tileRoadPath(tile, tile.roadConnections[index] ?? ["center"])
          .filter((_, i) => i % 2 === 0)
          .map(([px, pz], i) => (
            <mesh key={i} position={[px, 0.01, pz]} rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[0.086, 12]} />
              <meshBasicMaterial color="#ffde79" transparent opacity={0.6} depthWrite={false} />
            </mesh>
          ))}
      {feature.type === "field" &&
        tile.fieldSegments[index]?.corners.map((corner) => (
          <mesh key={corner} position={[CORNERS[corner][0], 0.009, CORNERS[corner][1]]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.12, 20]} />
            <meshBasicMaterial color="#ffde79" transparent opacity={0.6} depthWrite={false} />
          </mesh>
        ))}
      <mesh position={[anchor[0], 0.21, anchor[1]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.075, 0.095, 24]} />
        <meshBasicMaterial color="#ffe59a" depthTest={false} />
      </mesh>
    </group>
  );
}

/** Windows, lamps and warehouse glass glow after dark. */
export function NightLights({ night }: { night: boolean }) {
  const library = useContext(LibraryContext)!;
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    library.setNight(night);
    invalidate();
  }, [library, night, invalidate]);
  return null;
}

/** Drives the animated water while extra effects are on; idle frames stay on demand otherwise. */
export function WaterMotion({ enabled }: { enabled: boolean }) {
  const library = useContext(LibraryContext)!;
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    library.setExtraVfx(enabled);
    invalidate();
  }, [library, enabled, invalidate]);
  useFrame(({ clock }) => {
    if (!enabled) return;
    library.water.waterTime.value = clock.elapsedTime;
    // Requesting the next frame from inside this one keeps the demand loop running.
    invalidate();
  });
  return null;
}

/** Far enough out that the shadow camera sees the whole board from any angle. */
const LIGHT_DISTANCE = 12;

/**
 * Warm sun by day; a cool, dim moon at night. Shadows are cast in both. Both
 * cross the sky as `progress` runs from the first tile (0) to the last (1).
 */
export function Daylight({
  center = [0, 0],
  span = 4,
  night = false,
  progress = 0.5,
}: {
  center?: [number, number];
  span?: number;
  night?: boolean;
  progress?: number;
}) {
  const target = useMemo(() => new THREE.Object3D(), []);
  target.position.set(center[0], 0, center[1]);
  const pose = useMemo(() => skyPose(progress, night), [progress, night]);
  const light = pose.direction.clone().multiplyScalar(LIGHT_DISTANCE);
  return (
    <>
      <primitive object={target} />
      <hemisphereLight color={pose.sky} groundColor={pose.ground} intensity={pose.ambient} />
      <directionalLight
        position={[center[0] + light.x, light.y, center[1] + light.z]}
        target={target}
        intensity={pose.intensity}
        color={pose.color}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-span}
        shadow-camera-right={span}
        shadow-camera-top={span}
        shadow-camera-bottom={-span}
        shadow-camera-far={80}
        shadow-normalBias={0.012}
        shadow-bias={-0.0001}
      />
    </>
  );
}
