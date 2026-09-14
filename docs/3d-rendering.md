# 3D tabletop rendering

The React UI and framework-independent game engine remain connected through the
existing state-change listener. `BoardView` chooses the renderer; `GameBoard`
owns the game and renderer preference, so changing the view never recreates the
game. The preference is optional browser storage. Graphics failures affect the
current session, not the saved preference or game state.

## Coordinates and scenery

The board's `(x, y)` coordinates map to Three.js `(x, 0, z)`. Tile centers are at
integer coordinates, with edges half a unit away. Canonical geometry uses north
at negative Z. `Tile.rotate()` already rotates the logical connections;
`canonicalTile()` removes that orientation before model construction. Each
instance then applies one negative-Y quarter-turn per clockwise orientation.

`tileLayout.ts` derives road paths, shopping footprints, feature anchors, and
claim resolution from `ITile`. `scenery.ts` owns building layouts, vegetation,
fences, materials, and procedural ground/sign textures. Shopping portals share a
half-tile width; roads share a fixed width and tangent-aligned endpoints. Buildings
sit within their tile, and separate Costco zones retain separate paved areas.
Road shoulders, curbs, and asphalt are painted across the whole network in
separate passes so intersections have no internal borders. Lane markings leave
junction centers clear, with stop lines on incoming lanes. Asphalt extends into
shopping lots while parking covers the shoulders at each driveway entrance.

Stored road/store claims use cardinal directions, and field claims use corners.
They are resolved to the matching feature before placing followers; the 2D and
3D views share that resolver. Claims match exact tile coordinates, including
negative positions. Feature anchors deliberately avoid centroids that could sit
inside another feature.
Claim markers keep these world-space anchors but render as a final transparent
overlay with depth testing and depth writing disabled. Their solid colour and
base ring stay visible through buildings, trees, and placement previews; farmers
retain their lying-down shape. Markers do not cast misleading scenery shadows.

## Rendering and interaction

Three.js 0.170 and React Three Fiber 8 support the existing React 18 application.
Each canvas owns and disposes its scenery library. Geometry is merged by material
within a tile type, then repeated tiles are instanced across the board. A subtle
shader grid aligns to tile edges and fades out beyond the board, using one
additional draw call. The tile
gallery uses one canvas for every tile and rotation. The current-tile preview is
a second canvas, sharing the same model-building code and camera angle.

The orthographic camera has a fixed 45-degree diagonal and 50-degree elevation.
OrbitControls has rotation disabled. Automatic fitting follows board growth until
the player pans or zooms; Fit board re-enables it. Pointer-up placement requires a
primary click with no drag or multi-touch gesture. Touch selects a preview and
requires a separate confirmation. Both renderers gate placement to human turns.

Game-state notifications produce fresh render snapshots because the engine's
board object and tile map mutate in place. Rendering uses `frameloop="demand"`;
camera and instance-matrix changes explicitly invalidate it, including preview
rotation. Pixel density is capped at 1.5, with one
1024-pixel directional shadow map per scene. Context-loss listeners and a graphics
error boundary fall back to classic rendering without resetting the game.

## Verification

- Unit checks cover all 16 tile types in every rotation, edge portals, negative
  coordinates, separate shopping zones, stored claims, mutable board snapshots,
  and renderer preferences.
- Playwright exercises actual WebGL rendering, mouse drag versus click, rotation,
  feature claiming, touch confirmation/cancellation, switching views, context
  loss, unsupported WebGL, and a completed 52-tile game. Preview checks compare
  rendered pixels after each quarter turn, and texture checks catch borders or
  parking markings crossing junctions and driveway entrances.
  Marker checks compare their complete silhouettes with and without scenery for
  every feature on every tile/rotation, including opaque and translucent blockers.
- Storybook provides connected scenery, a full game, and all 64 type/rotation
  combinations for visual inspection.
- The development-only `/e2e/tiles.html?page=0` gallery has four pages (`0`–`3`)
  showing all 16 tile types at four readable orientations. Playwright saves these
  review sheets in its test artifacts.

The headless Linux Chromium/SwiftShader check measures draw calls, triangles,
and idle-frame stability; software-renderer timing is not a hardware FPS benchmark.
The target is smooth 60 fps desktop / 30 fps tablet navigation. Physical tablet
and GPU performance must still be measured on those devices before claiming that
target has been met.

Coverage combines the unit and Storybook browser suites because jsdom cannot
exercise WebGL. `npm run test:coverage` writes `coverage/combined/index.html` and
enforces the 80% line, statement, function, and branch targets on that merged
report. `npm run test:coverage:unit` produces the faster unit-only report.
