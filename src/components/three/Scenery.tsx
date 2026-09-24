import { tileRoadPath } from "@/rendering/riverLayout";
import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { warehouseLayout, warehouseLayoutKey } from "@/rendering/warehouseLayout";
import type { ITile } from "@/interfaces/ITile";
import type { ClaimableFeature, TileRecord } from "@/types";
import { SceneryLibrary, SceneryPart } from "@/rendering/scenery";
import { dominantRegion, regionWeights } from "@/rendering/regions";
import { hash01, type Species, speciesFor, vegetationSpots, worldSpot } from "@/rendering/vegetation";
import {
  canonicalTile,
  CORNERS,
  featureAnchor,
  Point,
  sceneryKey,
  zonePolygon,
} from "@/rendering/tileLayout";

const LibraryContext = createContext<SceneryLibrary | null>(null);

export function SceneryProvider({ children }: { children: React.ReactNode }) {
  const [library] = useState(() => new SceneryLibrary());
  useEffect(() => () => library.dispose(), [library]);
  return (
    <LibraryContext.Provider value={library}>
      {children}
    </LibraryContext.Provider>
  );
}

function Instances({
  part,
  records,
}: {
  part: SceneryPart;
  records: TileRecord[];
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((state) => state.invalidate);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    records.forEach(({ position, tile }, index) => {
      matrix.makeRotationY((-tile.orientation * Math.PI) / 2);
      matrix.setPosition(position.x, 0, position.y);
      mesh.setMatrixAt(index, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    // Instance matrices change outside React's mesh props. Demand rendering
    // needs an explicit frame when an existing tile moves or rotates.
    invalidate();
  }, [records, invalidate]);
  // R3F disposes each instance buffer. Geometry/material arguments belong to the
  // library and are not declaratively attached children, so they stay shared.
  return (
    <instancedMesh
      ref={ref}
      args={[part.geometry, part.material, records.length]}
      castShadow
      receiveShadow
    />
  );
}

interface PlantInstances {
  species: Species;
  matrices: THREE.Matrix4[];
  colors: THREE.Color[];
}

// The alternate crown tint that meadow trees used before they were instanced.
const DARK_CROWN = new THREE.Color("#477d50");
const LIGHT_CROWN = new THREE.Color("#65934d");
const DARK_TINT = new THREE.Color(
  DARK_CROWN.r / LIGHT_CROWN.r,
  DARK_CROWN.g / LIGHT_CROWN.g,
  DARK_CROWN.b / LIGHT_CROWN.b,
);
const WHITE = new THREE.Color(1, 1, 1);

/** Group every plant on the board by species, with a world transform each. */
export function plantInstances(records: TileRecord[], seed?: number): PlantInstances[] {
  const groups = new Map<Species, PlantInstances>();
  for (const { tile, position } of records) {
    const base = canonicalTile(tile);
    for (const spot of vegetationSpots(base)) {
      const [x, z] = worldSpot(position, tile.orientation, spot);
      const region = dominantRegion(regionWeights(x, z, seed));
      const species = speciesFor(region, spot.kind);
      const group = groups.get(species) ?? { species, matrices: [], colors: [] };
      const yaw = hash01(x, z, 1) * Math.PI * 2;
      group.matrices.push(
        new THREE.Matrix4().compose(
          new THREE.Vector3(x, 0, z),
          new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)),
          new THREE.Vector3(spot.scale, spot.scale, spot.scale),
        ),
      );
      group.colors.push(species === "round" && spot.kind === "tree" && spot.variant % 2 === 0 ? DARK_TINT : WHITE);
      groups.set(species, group);
    }
  }
  return [...groups.values()];
}

function PlantMesh({ plants }: { plants: PlantInstances }) {
  const library = useContext(LibraryContext)!;
  const ref = useRef<THREE.InstancedMesh>(null);
  const invalidate = useThree((state) => state.invalidate);
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
export function Vegetation({ records, seed }: { records: TileRecord[]; seed?: number }) {
  const groups = useMemo(() => plantInstances(records, seed), [records, seed]);
  return (
    <>
      {groups.map((plants) => (
        <PlantMesh key={`${plants.species}-${plants.matrices.length}`} plants={plants} />
      ))}
    </>
  );
}

/** One draw per material and tile type, regardless of how many copies are on the board. */
export function Scenery({ records, seed }: { records: TileRecord[]; seed?: number }) {
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
            <Instances
              key={`${i}-${tiles.length}`}
              part={part}
              records={tiles}
            />
          ))}
        </group>
      ))}
      <Warehouses records={records} />
      <Vegetation records={records} seed={seed} />
    </>
  );
}

function Warehouses({ records }: { records: TileRecord[] }) {
  return <WarehouseModel key={warehouseLayoutKey(records)} records={records} />;
}

function WarehouseModel({ records }: { records: TileRecord[] }) {
  const library = useContext(LibraryContext)!;
  // The parent key changes only when placed warehouse topology changes.
  const [model] = useState(
    () => library.createWarehouses(warehouseLayout(records)),
  );
  useEffect(() => () => model.parts.forEach((part) => part.geometry.dispose()), [model]);
  return (
    <group dispose={null} name="connected-warehouses">
      {model.parts.map((part, i) => (
        <mesh key={i} geometry={part.geometry} material={part.material} castShadow receiveShadow />
      ))}
    </group>
  );
}

export function GhostTile({
  tile,
  x,
  z,
}: {
  tile: ITile;
  x: number;
  z: number;
}) {
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
  useEffect(
    () => () => materials.forEach((material) => material.dispose()),
    [materials],
  );
  return (
    <group
      position={[x, 0.018, z]}
      rotation={[0, (-tile.orientation * Math.PI) / 2, 0]}
      dispose={null}
    >
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
      <group
        rotation={[0, 0, farmer ? Math.PI / 2 : 0]}
        position={[farmer ? 0.065 : 0, farmer ? 0.048 : 0.015, 0]}
      >
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
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.22}
            depthWrite={false}
          />
        </mesh>
      )}
      {[0, 1, 2, 3].map((edge) => (
        <mesh
          key={edge}
          position={[
            edge === 1 ? 0.485 : edge === 3 ? -0.485 : 0,
            0.003,
            edge === 0 ? -0.485 : edge === 2 ? 0.485 : 0,
          ]}
        >
          <boxGeometry
            args={edge % 2 ? [0.013, 0.008, 0.97] : [0.97, 0.008, 0.013]}
          />
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
    const shape = new THREE.Shape(
      points.map(([x, z]) => new THREE.Vector2(x, -z)),
    );
    return new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2);
  }, [points]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  return (
    <mesh geometry={geometry} position={[0, 0.008, 0]}>
      <meshBasicMaterial
        color="#ffde79"
        transparent
        opacity={0.55}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
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
  ) return null;
  const anchor = featureAnchor(tile, feature);
  return (
    <group position={[x, 0.004, z]}>
      {feature.type === "costco" && (
        <HighlightPolygon points={zonePolygon(tile, index)} />
      )}
      {feature.type === "road" &&
        tileRoadPath(tile, tile.roadConnections[index] ?? ["center"])
          .filter((_, i) => i % 2 === 0)
          .map(([px, pz], i) => (
            <mesh
              key={i}
              position={[px, 0.01, pz]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <circleGeometry args={[0.086, 12]} />
              <meshBasicMaterial
                color="#ffde79"
                transparent
                opacity={0.6}
                depthWrite={false}
              />
            </mesh>
          ))}
      {feature.type === "field" &&
        tile.fieldSegments[index]?.corners.map((corner) => (
          <mesh
            key={corner}
            position={[CORNERS[corner][0], 0.009, CORNERS[corner][1]]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[0.12, 20]} />
            <meshBasicMaterial
              color="#ffde79"
              transparent
              opacity={0.6}
              depthWrite={false}
            />
          </mesh>
        ))}
      <mesh
        position={[anchor[0], 0.21, anchor[1]]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.075, 0.095, 24]} />
        <meshBasicMaterial color="#ffe59a" depthTest={false} />
      </mesh>
    </group>
  );
}

export function Daylight({
  center = [0, 0],
  span = 4,
}: {
  center?: [number, number];
  span?: number;
}) {
  const target = useMemo(() => new THREE.Object3D(), []);
  target.position.set(center[0], 0, center[1]);
  return (
    <>
      <primitive object={target} />
      <hemisphereLight args={["#fff6df", "#788a77", 2.1]} />
      <directionalLight
        position={[center[0] - 5, 10, center[1] + 4]}
        target={target}
        intensity={2.5}
        color="#fff0d5"
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
