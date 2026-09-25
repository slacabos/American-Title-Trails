import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Minus, Plus } from "lucide-react";
import type { ClaimableFeature, GameState, Position } from "@/types";
import type { ITile } from "@/interfaces/ITile";
import { GamePhase } from "@/types";
import {
  boardSnapshot,
  featureAnchor,
  positionKey,
  resolveClaim,
  samePosition,
  worldToBoard,
} from "@/rendering/tileLayout";
import {
  CellOutline,
  Daylight,
  FeatureHighlight,
  Follower,
  GhostTile,
  NightLights,
  Scenery,
  SceneryProvider,
} from "./Scenery";
import { useTranslations } from "@/hooks/useTranslations";
import { PlacementGrid } from "./PlacementGrid";
import type { CompletedCostco } from "@/rendering/completedCostcos";
import { SCENE_PALETTE } from "@/rendering/timeOfDay";

export interface BoardSceneProps {
  state: GameState;
  onTilePlace: (position: Position) => void;
  onUnavailable: () => void;
  highlightedFeature?: ClaimableFeature;
  completedCostcos?: CompletedCostco[];
  night?: boolean;
}

function CompletedCostcoMarker({ center }: { center: CompletedCostco["center"] }) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 160;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f4bf4f";
    ctx.beginPath();
    ctx.arc(80, 80, 73, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#62461e";
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.fillStyle = "#352a17";
    ctx.font = "bold 100px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✓", 80, 86);
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    return result;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <sprite name="completed-costco-marker" position={[center.x, 0.54, center.y]} scale={[0.22, 0.22, 1]} renderOrder={20}>
      <spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} />
    </sprite>
  );
}
interface CameraActions {
  fit: () => void;
  zoom: (factor: number) => void;
}
const CAMERA_DIRECTION = new THREE.Vector3(
  1,
  Math.tan((50 * Math.PI) / 180) * Math.SQRT2,
  1,
).normalize();

function ContextHealth({ onUnavailable }: { onUnavailable: () => void }) {
  const { gl, get } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      // R3F deliberately loses the context when disposing an unmounted canvas.
      if (!canvas.isConnected || !get().internal.active) return;
      event.preventDefault();
      onUnavailable();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, get, onUnavailable]);
  return null;
}

function Navigation({
  state,
  legal,
  onHover,
  onSelect,
  onTilePlace,
  actions,
}: {
  state: GameState;
  legal: Position[];
  onHover: (position?: Position) => void;
  onSelect: (position: Position) => void;
  onTilePlace: (position: Position) => void;
  actions: React.MutableRefObject<CameraActions | null>;
}) {
  const { camera, gl, size, invalidate } = useThree();
  const controls = useRef<OrbitControls | undefined>(undefined);
  const autoFit = useRef(true);
  const fitRef = useRef<() => void>(() => {});
  // Pointer listeners are attached once; they read the latest props from here.
  const latest = useRef({ legal, onHover, onSelect, onTilePlace });
  useLayoutEffect(() => {
    latest.current = { legal, onHover, onSelect, onTilePlace };
  });
  const bounds = state.board.getBounds();
  const { minX, minY, maxX, maxY } = bounds;

  const fit = useCallback(() => {
    const cam = camera as THREE.OrthographicCamera;
    const target = new THREE.Vector3((minX + maxX) / 2, 0, (minY + maxY) / 2);
    camera.position.copy(target).addScaledVector(CAMERA_DIRECTION, 30);
    camera.lookAt(target);
    camera.updateMatrixWorld();
    if (controls.current) controls.current.target.copy(target);
    const inverse = camera.matrixWorldInverse;
    const projected = new THREE.Box3();
    for (const x of [minX - 1.5, maxX + 1.5])
      for (const z of [minY - 1.5, maxY + 1.5]) {
        projected.expandByPoint(
          new THREE.Vector3(x, 0, z).applyMatrix4(inverse),
        );
        projected.expandByPoint(
          new THREE.Vector3(x, 0.4, z).applyMatrix4(inverse),
        );
      }
    const span = projected.getSize(new THREE.Vector3());
    cam.zoom = Math.min(180, size.width / span.x, size.height / span.y) * 0.9;
    cam.updateProjectionMatrix();
    controls.current?.update();
    invalidate();
  }, [camera, minX, minY, maxX, maxY, size.width, size.height, invalidate]);
  // Layout effects run before the controls effect below first calls it.
  useLayoutEffect(() => {
    fitRef.current = fit;
  }, [fit]);

  useEffect(() => {
    const orbit = new OrbitControls(camera, gl.domElement);
    controls.current = orbit;
    orbit.enableRotate = false;
    orbit.enableDamping = false;
    orbit.screenSpacePanning = false;
    orbit.minZoom = 8;
    orbit.maxZoom = 320;
    orbit.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    orbit.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
    const changed = () => invalidate();
    orbit.addEventListener("change", changed);
    actions.current = {
      fit: () => {
        autoFit.current = true;
        fitRef.current();
      },
      zoom: (factor) => {
        autoFit.current = false;
        const cam = camera as THREE.OrthographicCamera;
        cam.zoom = THREE.MathUtils.clamp(cam.zoom * factor, 8, 320);
        cam.updateProjectionMatrix();
        invalidate();
      },
    };
    fitRef.current();
    return () => {
      orbit.dispose();
      controls.current = undefined;
      actions.current = null;
    };
  }, [camera, gl, invalidate, actions]);

  useEffect(() => {
    if (autoFit.current) fit();
  }, [fit]);

  useEffect(() => {
    const canvas = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    const pointers = new Set<number>();
    let start:
      | { x: number; y: number; type: string; button: number }
      | undefined;
    let cancelled = false;
    const pick = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          (-(event.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      if (!raycaster.ray.intersectPlane(plane, hit)) return undefined;
      const position = worldToBoard(hit.x, hit.z);
      return latest.current.legal.find((candidate) =>
        samePosition(position, candidate),
      );
    };
    const down = (event: PointerEvent) => {
      pointers.add(event.pointerId);
      if (pointers.size === 1) {
        start = {
          x: event.clientX,
          y: event.clientY,
          type: event.pointerType,
          button: event.button,
        };
        cancelled = false;
      } else {
        cancelled = true;
        autoFit.current = false;
        latest.current.onHover(undefined);
      }
    };
    const move = (event: PointerEvent) => {
      if (
        start &&
        pointers.size &&
        Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6
      ) {
        cancelled = true;
        autoFit.current = false;
        latest.current.onHover(undefined);
      }
      if (!pointers.size && event.pointerType !== "touch")
        latest.current.onHover(pick(event));
    };
    const up = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return;
      pointers.delete(event.pointerId);
      if (
        start &&
        !cancelled &&
        start.button === 0 &&
        pointers.size === 0 &&
        Math.hypot(event.clientX - start.x, event.clientY - start.y) <= 6
      ) {
        const position = pick(event);
        if (position) {
          if (start.type === "touch") latest.current.onSelect(position);
          else latest.current.onTilePlace(position);
        }
      }
      if (!pointers.size) start = undefined;
    };
    const cancel = () => {
      cancelled = true;
      pointers.clear();
      start = undefined;
      latest.current.onHover(undefined);
    };
    const leave = () => latest.current.onHover(undefined);
    const wheel = () => {
      autoFit.current = false;
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", cancel);
    canvas.addEventListener("lostpointercapture", cancel);
    canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("wheel", wheel, { passive: true });
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", cancel);
      canvas.removeEventListener("lostpointercapture", cancel);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("wheel", wheel);
    };
  }, [camera, gl]);
  return null;
}

export function BoardScene({
  state,
  onTilePlace,
  onUnavailable,
  highlightedFeature,
  completedCostcos = [],
  night = false,
}: BoardSceneProps) {
  const palette = SCENE_PALETTE[night ? "night" : "day"];
  const { t } = useTranslations();
  const snapshot = useMemo(() => boardSnapshot(state), [state]);
  // A hover or touch selection survives rotation, but never a turn or a
  // placement: each remembers the turn it was made in and lapses after it.
  const turn = `${state.turnNumber}:${state.phase}:${state.currentPlayerIndex}`;
  const [hoverAt, setHoverAt] = useState<{ turn: string; position?: Position }>();
  const [selectedAt, setSelectedAt] = useState<{ turn: string; position?: Position }>();
  const hover = hoverAt?.turn === turn ? hoverAt.position : undefined;
  const selected = selectedAt?.turn === turn ? selectedAt.position : undefined;
  const actions = useRef<CameraActions | null>(null);
  const setHovered = useCallback(
    (position?: Position) =>
      setHoverAt((previous) =>
        previous?.turn === turn && samePosition(previous.position, position)
          ? previous
          : { turn, position },
      ),
    [turn],
  );
  const setSelected = useCallback(
    (position?: Position) => setSelectedAt({ turn, position }),
    [turn],
  );
  const preview = snapshot.legal.find((position) =>
    samePosition(position, selected ?? hover),
  );
  const last =
    state.lastPlacedPosition && state.board.getTile(state.lastPlacedPosition);
  const bounds = state.board.getBounds();
  const center: [number, number] = [
    (bounds.minX + bounds.maxX) / 2,
    (bounds.minY + bounds.maxY) / 2,
  ];
  const span =
    Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) + 5;

  return (
    <div className="tabletop-scene" data-testid="board-3d">
      <Canvas
        orthographic
        shadows="percentage"
        camera={{ position: [12, 20, 12], zoom: 90, near: 0.1, far: 150 }}
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{ antialias: true, alpha: false, powerPreference: "low-power" }}
        fallback={t("board.unavailable")}
      >
        <color attach="background" args={[palette.background]} />
        <ContextHealth onUnavailable={onUnavailable} />
        <Navigation
          state={state}
          legal={snapshot.legal}
          onHover={setHovered}
          onSelect={setSelected}
          onTilePlace={onTilePlace}
          actions={actions}
        />
        <Daylight center={center} span={span} night={night} />
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[center[0], -0.096, center[1]]}
          receiveShadow
        >
          <planeGeometry args={[300, 300]} />
          <meshStandardMaterial color={palette.table} roughness={1} />
        </mesh>
        <PlacementGrid bounds={bounds} color={palette.grid} />
        <SceneryProvider>
          <NightLights night={night} />
          <Scenery records={snapshot.tiles} seed={state.sceneSeed} />
          {snapshot.legal.map((position) => (
            <CellOutline
              key={positionKey(position)}
              x={position.x}
              z={position.y}
              fill
            />
          ))}
          {preview && state.currentTile && (
            <>
              <GhostTile tile={state.currentTile} x={preview.x} z={preview.y} />
              <CellOutline x={preview.x} z={preview.y} color="#fff2ba" />
            </>
          )}
        </SceneryProvider>
        {snapshot.tiles.flatMap((record) =>
          snapshot.claims.flatMap((claim) => {
            const feature = resolveClaim(record.tile, record.position, claim);
            if (!feature) return [];
            const [x, z] = featureAnchor(record.tile, feature);
            return claim.players.map((id, i) => {
              const player = state.players.find(
                (candidate) => candidate.id === id,
              );
              return player ? (
                <Follower
                  key={`${claim.edge}-${id}-${i}`}
                  point={[
                    record.position.x + x + i * 0.085,
                    feature.type === "mcdonalds" ? 0.16 : 0.012,
                    record.position.y + z,
                  ]}
                  color={player.color}
                  farmer={claim.followerType === "farmer"}
                />
              ) : null;
            });
          }),
        )}
        {completedCostcos.map((completed, index) => (
          <CompletedCostcoMarker key={`${completed.center.x},${completed.center.y},${index}`} center={completed.center} />
        ))}
        {last && (
          <CellOutline
            x={last.position.x}
            z={last.position.y}
            color="#e8c572"
          />
        )}
        {last &&
          highlightedFeature &&
          state.phase === GamePhase.CLAIM_FEATURE && (
            <FeatureHighlight
              tile={last.tile}
              feature={highlightedFeature}
              x={last.position.x}
              z={last.position.y}
            />
          )}
      </Canvas>
      <div className="tabletop-compass" aria-hidden="true">
        {t("board.compass")}↗
      </div>
      <div
        className="board-pill tabletop-camera-controls"
        role="group"
        aria-label={t("board.cameraControls")}
      >
        <span className="board-pill-status">
          {t(snapshot.tiles.length === 1 ? "board.tilesOne" : "board.tiles", {
            count: snapshot.tiles.length,
          })}
          {snapshot.canPlace
            ? ` · ${t(snapshot.legal.length === 1 ? "board.legalOne" : "board.legal", { count: snapshot.legal.length })}`
            : ""}
        </span>
        <span className="board-pill-divider" aria-hidden="true" />
        <button
          type="button"
          aria-label={t("board.zoomOut")}
          onClick={() => actions.current?.zoom(1 / 1.2)}
        >
          <Minus size={16} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => actions.current?.fit()}>
          {t("board.fit")}
        </button>
        <button
          type="button"
          aria-label={t("board.zoomIn")}
          onClick={() => actions.current?.zoom(1.2)}
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
      {selected && snapshot.canPlace && (
        <div className="tabletop-confirm">
          <button
            type="button"
            disabled={!preview}
            onClick={() => {
              if (!preview) return;
              onTilePlace(preview);
              setSelected(undefined);
            }}
          >
            {t("board.place")}
          </button>
          <button type="button" onClick={() => setSelected(undefined)}>
            {t("board.cancel")}
          </button>
        </div>
      )}
    </div>
  );
}

export function TilePreviewScene({
  tile,
  onUnavailable,
  night = false,
}: {
  tile?: ITile;
  onUnavailable: () => void;
  night?: boolean;
}) {
  const { t } = useTranslations();
  const records = useMemo(
    () => tile ? [{ tile, position: { x: 0, y: 0 } }] : [],
    [tile],
  );
  return (
    <div className="tabletop-tile-preview" role="img" aria-label={tile?.name}>
      <Canvas
        orthographic
        shadows="percentage"
        camera={{ position: [3, 5.056, 3], zoom: 122, near: 0.1, far: 40 }}
        frameloop="demand"
        dpr={[1, 1.5]}
        fallback={t("board.previewUnavailable")}
        onCreated={({ camera }) => camera.lookAt(0, 0.04, 0)}
      >
        <ContextHealth onUnavailable={onUnavailable} />
        <Daylight night={night} />
        <SceneryProvider>
          <NightLights night={night} />
          <Scenery records={records} />
        </SceneryProvider>
      </Canvas>
    </div>
  );
}
