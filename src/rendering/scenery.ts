import { hasRiverBridge, nearRiver, paintRiver, restaurantPosition, tileRoadPath } from "./riverLayout";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { ITile } from "@/interfaces/ITile";
import { buildWarehouses } from "./warehouseGeometry";
import { WarehouseComplex, warehouseLayout } from "./warehouseLayout";
import {
  canonicalTile,
  CORNERS,
  insidePolygon,
  Point,
  ROAD_WIDTH,
  sceneryKey,
  zonePolygon,
} from "./tileLayout";

interface BuildingLayout {
  x: number;
  z: number;
  yaw?: number;
  width?: number;
  depth?: number;
}
const scenerySeed = (id: string) => Array.from(id).reduce(
  (seed, character) => (seed * 31 + character.charCodeAt(0)) >>> 0, 177,
);
const PENNANTS: Record<string, Point> = {
  "costco-road": [0.26, -0.2],
  "costco-complex-l": [0.17, -0.05],
  "costco-mega-complex": [0.11, -0.09],
};

// These fields are separate in the rules even where no road divides the grass.
const FIELD_FENCES: Record<string, [Point, Point][]> = {
  "costco-separate-dual": [
    [
      [-0.49, 0],
      [0.49, 0],
    ],
  ],
  "costco-peninsula": [
    [
      [0, -0.49],
      [0, 0.49],
    ],
  ],
  "costco-corner": [
    [
      [-0.49, 0],
      [0, 0],
    ],
  ],
};

export interface SceneryPart {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}
export interface TileModel {
  parts: SceneryPart[];
}

/** A canvas-scoped resource owner: models are shared by every instance and disposed together. */
export class SceneryLibrary {
  private models = new Map<string, TileModel>();
  private materials = new Map<string, THREE.Material>();
  private textures = new Set<THREE.Texture>();
  private ghosts = new Map<string, TileModel>();
  private ghostGeometry = new Set<THREE.BufferGeometry>();

  /** Board geometry is owned by its component; shared materials live here. */
  createWarehouses(layout: WarehouseComplex[]): TileModel {
    let roof = this.materials.get("warehouse-roof");
    if (!roof) {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 256;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#9caeaf";
      ctx.fillRect(0, 0, 256, 256);
      for (let x = 0; x < 256; x += 16) {
        ctx.fillStyle = "#82999b";
        ctx.fillRect(x, 0, 1, 256);
        ctx.fillStyle = "#b9c7c6";
        ctx.fillRect(x + 1, 0, 1, 256);
      }
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = 4;
      this.textures.add(texture);
      roof = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85 });
      this.materials.set("warehouse-roof", roof);
    }
    return buildWarehouses(layout, {
      roof, wall: this.material("#e4ddca"), trim: this.material("#d9d4be"),
      fascia: this.material("#c5493f"), glass: this.material("#254c58"),
      metal: this.material("#667b7e"), marking: this.material("#eef0dd"),
      sign: this.label("costco"),
    });
  }

  /** A prospective tile shows a complete standalone section before placement. */
  getGhost(tile: ITile): TileModel {
    const key = sceneryKey(tile);
    const cached = this.ghosts.get(key);
    if (cached) return cached;
    const warehouse = this.createWarehouses(warehouseLayout([
      { tile: canonicalTile(tile), position: { x: 0, y: 0 } },
    ]));
    warehouse.parts.forEach((part) => this.ghostGeometry.add(part.geometry));
    const model = { parts: [...this.get(tile).parts, ...warehouse.parts] };
    this.ghosts.set(key, model);
    return model;
  }

  private material(color: string): THREE.Material {
    let material = this.materials.get(color);
    if (!material) {
      material = new THREE.MeshStandardMaterial({ color, roughness: 0.87 });
      this.materials.set(color, material);
    }
    return material;
  }

  private label(kind: "costco" | "mcdonalds"): THREE.Material {
    const key = `label-${kind}`;
    const cached = this.materials.get(key);
    if (cached) return cached;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 160;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = kind === "costco" ? "#f6f1e6" : "#bd302a";
    ctx.fillRect(0, 0, 512, 160);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "italic 900 99px Arial, sans-serif";
    ctx.fillStyle = kind === "costco" ? "#cb3438" : "#ffd461";
    ctx.fillText(kind === "costco" ? "COSTCO" : "McDonald's", 256, 66, 474);
    if (kind === "costco") {
      ctx.fillStyle = "#34728b";
      ctx.font = "bold 28px Arial, sans-serif";
      ctx.fillText("WHOLESALE", 286, 131);
      ctx.fillRect(28, 117, 79, 5);
      ctx.fillRect(28, 128, 70, 5);
      ctx.fillRect(28, 139, 61, 5);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.textures.add(texture);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      toneMapped: false,
    });
    this.materials.set(key, material);
    return material;
  }

  /** Get a shared canonical model, building its geometry and textures on first use. */
  get(tile: ITile): TileModel {
    const key = sceneryKey(tile);
    const cached = this.models.get(key);
    if (cached) return cached;
    const base = canonicalTile(tile);
    const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
    const add = (
      geometry: THREE.BufferGeometry,
      material: THREE.Material,
      position: THREE.Vector3,
      rotation = new THREE.Euler(),
    ) => {
      geometry.applyMatrix4(
        new THREE.Matrix4().compose(
          position,
          new THREE.Quaternion().setFromEuler(rotation),
          new THREE.Vector3(1, 1, 1),
        ),
      );
      const list = batches.get(material) ?? [];
      list.push(geometry);
      batches.set(material, list);
    };
    const box = (
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      color: string,
      yaw = 0,
    ) =>
      add(
        new THREE.BoxGeometry(w, h, d),
        this.material(color),
        new THREE.Vector3(x, y, z),
        new THREE.Euler(0, yaw, 0),
      );

    box(0, -0.047, 0, 0.994, 0.084, 0.994, "#ad9171");
    box(0, -0.012, 0, 0.998, 0.012, 0.998, "#d1c6a0");
    const groundTexture = this.ground(base);
    const groundMaterial = new THREE.MeshStandardMaterial({
      map: groundTexture,
      roughness: 1,
    });
    this.materials.set(`ground-${key}`, groundMaterial);
    add(
      new THREE.PlaneGeometry(1, 1),
      groundMaterial,
      new THREE.Vector3(0, 0, 0),
      new THREE.Euler(-Math.PI / 2, 0, 0),
    );

    const building = (layout: BuildingLayout) => {
      const {
        x,
        z,
        yaw = 0,
        width = 0.36,
        depth = 0.23,
      } = layout;
      const height = 0.105;
      const local = (lx: number, ly: number, lz: number) =>
        new THREE.Vector3(
          x + lx * Math.cos(yaw) + lz * Math.sin(yaw),
          ly,
          z - lx * Math.sin(yaw) + lz * Math.cos(yaw),
        );
      const block = (
        lx: number,
        ly: number,
        lz: number,
        w: number,
        h: number,
        d: number,
        color: string,
      ) => {
        const p = local(lx, ly, lz);
        box(p.x, p.y, p.z, w, h, d, color, yaw);
      };
      block(0, 0.008, 0, width + 0.025, 0.016, depth + 0.025, "#d9d4be");
      block(
        0,
        height / 2 + 0.016,
        0,
        width,
        height,
        depth,
        "#e9d6b7",
      );
      block(
        0,
        height + 0.022,
        0,
        width + 0.018,
        0.018,
        depth + 0.018,
        "#c64032",
      );
      block(
        0,
        height * 0.62,
        depth / 2 + 0.003,
        width * 0.94,
        0.025,
        0.008,
        "#bf3d32",
      );
      for (const sign of [-1, 1]) {
        block(
          sign * width * 0.27,
          height * 0.27,
          depth / 2 + 0.006,
          width * 0.24,
          height * 0.37,
          0.008,
          "#466b73",
        );
      }
      block(
        0,
        height * 0.25,
        depth / 2 + 0.009,
        width * 0.16,
        height * 0.41,
        0.011,
        "#254c58",
      );
      // Roof lettering remains legible from the fixed tabletop camera.
      add(
        new THREE.PlaneGeometry(width * 0.9, depth * 0.62),
        this.label("mcdonalds"),
        local(0, height + 0.032, 0),
        new THREE.Euler(-Math.PI / 2, 0, yaw),
      );
      block(
        -width * 0.27,
        height + 0.05,
        -depth * 0.27,
        0.043,
        0.035,
        0.036,
        "#8e9a97",
      );
    };
    if (base.hasMcDonalds) {
      const [rx, rz] = restaurantPosition(base);
      building({ x: rx, z: rz, ...(base.river ? { width: 0.28, depth: 0.17 } : {}) });
      const signZ = base.id === "river-lake" ? 0.04 : -0.33;
      box(0.3, 0.14, base.river ? signZ : -0.27, 0.016, 0.28, 0.016, "#e4d8b7");
      box(0.3, 0.24, base.river ? signZ : -0.27, 0.14, 0.075, 0.025, "#bf3a2e");
      for (const x of [0.271, 0.329]) {
        const arc = new THREE.EllipseCurve(
          x,
          0.262,
          0.029,
          0.063,
          0,
          Math.PI,
          false,
          0,
        ).getPoints(12);
        for (let i = 1; i < arc.length; i++) {
          const a = arc[i - 1],
            b = arc[i];
          const geometry = new THREE.BoxGeometry(
            0.01,
            a.distanceTo(b) + 0.003,
            0.01,
          );
          add(
            geometry,
            this.material("#ffd35b"),
            new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2, base.river ? signZ + 0.02 : -0.25),
            new THREE.Euler(0, 0, -Math.atan2(b.x - a.x, b.y - a.y)),
          );
        }
      }
    }

    // Bonus pennants become gold roadside markers; the gas-station tile also gets a canopy.
    base.costcoZones.forEach((zone) => {
      if (!zone.hasPennant) return;
      const [x, z] = PENNANTS[base.id] ?? [0.11, -0.03];
      box(
        x,
        0.23,
        z,
        0.008,
        0.14,
        0.008,
        "#b89a51",
      );
      box(
        x + 0.03,
        0.28,
        z,
        0.065,
        0.044,
        0.009,
        "#ffd15c",
      );
    });
    if (base.id === "costco-road") {
      box(-0.08, 0.09, 0.02, 0.2, 0.019, 0.105, "#ce4a38");
      for (const x of [-0.15, -0.01]) {
        box(x, 0.045, 0.02, 0.009, 0.09, 0.009, "#eee0bf");
        box(x, 0.025, 0.02, 0.03, 0.043, 0.03, "#3d656a");
      }
    }

    const zones = base.costcoZones.map((_, i) => zonePolygon(base, i));
    const roads = base.roadConnections.flatMap(connection => tileRoadPath(base, connection));
    (FIELD_FENCES[base.id] ?? []).forEach(([a, b]) => {
      const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const steps = Math.ceil(length / 0.065);
      const yaw = -Math.atan2(b[1] - a[1], b[0] - a[0]);
      for (let i = 0; i < steps; i++) {
        const t = (i + 0.5) / steps;
        const x = a[0] + (b[0] - a[0]) * t,
          z = a[1] + (b[1] - a[1]) * t;
        if (
          zones.some((polygon) => insidePolygon([x, z], polygon)) ||
          roads.some(([rx, rz]) => Math.hypot(rx - x, rz - z) < 0.13)
        )
          continue;
        box(x, 0.022, z, 0.009, 0.045, 0.009, "#9b865a");
        box(x, 0.03, z, length / steps, 0.009, 0.008, "#af9d71", yaw);
      }
    });
    if (hasRiverBridge(base)) {
      const horizontal = base.id === "river-road-bridge";
      const halfLength = horizontal ? 0.36 : 0.30;
      const heightAt = (t: number) => 0.012 + 0.065 * Math.sin(Math.PI * t);
      const vertices: number[] = [];
      const indices: number[] = [];
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        const along = -halfLength + t * 2 * halfLength;
        for (const side of [-1, 1]) vertices.push(horizontal ? along : side * ROAD_WIDTH / 2, heightAt(t), horizontal ? side * ROAD_WIDTH / 2 : along);
        if (i < 16) { const k = i * 2; indices.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
        if (i < 16) {
          const next = -halfLength + (i + 1) / 16 * 2 * halfLength;
          for (const side of [-1, 1]) {
            const rail = ROAD_WIDTH / 2 + 0.012;
            box(horizontal ? (along + next) / 2 : side * rail, heightAt((i + 0.5) / 16) + 0.035,
              horizontal ? side * rail : (along + next) / 2,
              horizontal ? next - along + 0.002 : 0.012, 0.027, horizontal ? 0.012 : next - along + 0.002, "#d8d5bd");
          }
          if (i % 3 === 0) box(horizontal ? along : 0, heightAt(t) + 0.002, horizontal ? 0 : along,
            horizontal ? 0.035 : 0.004, 0.004, horizontal ? 0.004 : 0.035, "#f2d786");
        }
      }
      const deck = new THREE.BufferGeometry();
      deck.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
      deck.setAttribute("uv", new THREE.Float32BufferAttribute(new Array(vertices.length / 3 * 2).fill(0), 2));
      deck.setIndex(indices);
      deck.computeVertexNormals();
      // The ribbon's winding depends on the road axis.
      const material = this.material("#626c69");
      material.side = THREE.DoubleSide;
      add(deck, material, new THREE.Vector3());
    }

    const corners = [
      ...new Set(base.fieldSegments.flatMap((segment) => segment.corners)),
    ];
    corners.forEach((corner, i) => {
      const [x, z] = CORNERS[corner];
      const variation = (scenerySeed(base.id) + i * 137) >>> 0;
      if (
        (i > 0 && variation % 5 === 0) ||
        nearRiver(base, [x, z], 0.10) ||
        (base.river && base.hasMcDonalds && Math.hypot(x - restaurantPosition(base)[0], z - restaurantPosition(base)[1]) < 0.28) ||
        zones.some((polygon) => insidePolygon([x, z], polygon)) ||
        roads.some(([rx, rz]) => Math.hypot(rx - x, rz - z) < 0.19)
      )
        return;
      const treeX = x + ((variation % 17) / 16 - 0.5) * 0.06;
      const treeZ = z + (((variation >>> 4) % 17) / 16 - 0.5) * 0.06;
      add(
        new THREE.CylinderGeometry(0.01, 0.015, 0.09, 5),
        this.material("#826a4b"),
        new THREE.Vector3(treeX, 0.043, treeZ),
      );
      add(
        new THREE.IcosahedronGeometry(0.055 + (variation % 4) * 0.006, 1),
        this.material(i % 2 ? "#65934d" : "#477d50"),
        new THREE.Vector3(treeX, 0.12, treeZ),
      );
      add(
        new THREE.IcosahedronGeometry(0.035, 0),
        this.material("#88a75a"),
        new THREE.Vector3(x - 0.065, 0.025, z + 0.027),
      );
      if (variation % 3 === 0) {
        const sapling: Point = [treeX - Math.sign(x) * 0.09, treeZ];
        if (!nearRiver(base, sapling, 0.06) && !zones.some((polygon) => insidePolygon(sapling, polygon)) &&
          !roads.some(([rx, rz]) => Math.hypot(rx - sapling[0], rz - sapling[1]) < 0.15)) {
          add(new THREE.CylinderGeometry(0.006, 0.01, 0.065, 5), this.material("#826a4b"),
            new THREE.Vector3(sapling[0], 0.032, sapling[1]));
          add(new THREE.IcosahedronGeometry(0.042, 1), this.material("#65934d"),
            new THREE.Vector3(sapling[0], 0.088, sapling[1]));
        }
      }
    });

    const parts: SceneryPart[] = [];
    for (const [material, geometries] of batches) {
      const geometry = mergeGeometries(geometries);
      geometries.forEach((source) => source.dispose());
      if (geometry) parts.push({ geometry, material });
    }
    const model = { parts };
    this.models.set(key, model);
    return model;
  }

  private ground(tile: ITile): THREE.Texture {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#83a365";
    ctx.fillRect(0, 0, 512, 512);
    // Deterministic, fine-grained grass texture; no runtime random scenery changes.
    let seed = scenerySeed(tile.id);
    for (let i = 0; i < 2400; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const x = seed % 512;
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const y = seed % 512;
      ctx.fillStyle = i % 2 ? "#819e642c" : "#bfcb902c";
      ctx.fillRect(x, y, 2, 2);
    }
    // Soft meadow patches vary by tile type, fading before the matching edges.
    for (let i = 0; i < 18; i++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const x = 80 + seed % 352;
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const y = 80 + seed % 352;
      for (let radius = 64; radius >= 16; radius -= 16) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 ? "#547b4707" : "#c1c98107";
        ctx.fill();
      }
    }
    ctx.save();
    ctx.translate(256, 256);
    ctx.scale(512, 512);
    const path = (points: Point[], close = false) => {
      ctx.beginPath();
      points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      if (close) ctx.closePath();
    };
    const roads = tile.roadConnections.map(connection => tileRoadPath(tile, connection));
    const zones = tile.costcoZones.map((_, index) => zonePolygon(tile, index));
    const approaches = roads.filter((points) =>
      points[points.length - 1].every((coordinate) => coordinate === 0),
    );
    const junction = approaches.length > 1;
    const roadLayer = (color: string, width: number) => {
      ctx.lineWidth = width;
      ctx.strokeStyle = color;
      roads.forEach((points) => {
        path(points);
        ctx.stroke();
      });
    };
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    // Paint the network one layer at a time so branch caps cannot create
    // curbs across an intersection. Parking covers shoulders at entrances;
    // the asphalt is painted last to form a driveway into the lot.
    roadLayer("#d3c298", ROAD_WIDTH + 0.058);
    roadLayer("#ddd8bd", ROAD_WIDTH + 0.016);
    tile.costcoZones.forEach((_, index) => {
      const polygon = zonePolygon(tile, index);
      path(polygon, true);
      ctx.fillStyle = "#b6bbad";
      ctx.fill();
    });
    if (tile.hasMcDonalds && !tile.river) {
      ctx.fillStyle = "#b8b9a6";
      ctx.fillRect(-0.3, -0.25, 0.58, 0.51);
      ctx.strokeStyle = "#f4e4bf";
      ctx.lineWidth = 0.006;
      for (let x = -0.26; x < 0.26; x += 0.085) {
        ctx.beginPath();
        ctx.moveTo(x, 0.145);
        ctx.lineTo(x, 0.235);
        ctx.stroke();
      }
    }
    if (tile.hasMcDonalds && tile.river) {
      const [x, z] = restaurantPosition(tile);
      ctx.fillStyle = "#b8b9a6";
      ctx.fillRect(x - 0.18, z - 0.12, 0.36, 0.26);
    }
    roadLayer("#626c69", ROAD_WIDTH);
    ctx.lineWidth = 0.0035;
    ctx.strokeStyle = "#f2d786";
    ctx.setLineDash([0.036, 0.025]);
    roads.forEach((points) => {
      const terminates = approaches.includes(points);
      let drawing = false;
      ctx.beginPath();
      for (const [x, z] of points) {
        const clearCenter =
          terminates && Math.hypot(x, z) < (junction ? ROAD_WIDTH : 0.06);
        const inParking = zones.some((polygon) =>
          insidePolygon([x, z], polygon),
        );
        if (clearCenter || inParking) {
          drawing = false;
          continue;
        }
        if (drawing) ctx.lineTo(x, z);
        else ctx.moveTo(x, z);
        drawing = true;
      }
      ctx.stroke();
    });
    ctx.setLineDash([]);
    if (junction) {
      // Stop lines sit in each inbound lane, leaving the shared junction clear.
      ctx.lineCap = "butt";
      ctx.lineWidth = 0.012;
      ctx.strokeStyle = "#f4efda";
      approaches.forEach((points) => {
        const [x, z] = points[0].map((coordinate) => coordinate * 2);
        const distance = ROAD_WIDTH * 0.85;
        path([
          [x * distance + z * 0.012, z * distance - x * 0.012],
          [
            x * distance + z * ROAD_WIDTH * 0.44,
            z * distance - x * ROAD_WIDTH * 0.44,
          ],
        ]);
        ctx.stroke();
      });
    }
    paintRiver(ctx, tile);
    ctx.restore();
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    this.textures.add(texture);
    return texture;
  }

  /** Release the canvas's geometry, materials, and textures on unmount. */
  dispose(): void {
    this.ghostGeometry.forEach((geometry) => geometry.dispose());
    this.models.forEach((model) =>
      model.parts.forEach((part) => part.geometry.dispose()),
    );
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
  }
}
