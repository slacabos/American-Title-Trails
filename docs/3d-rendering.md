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
claim resolution from `ITile`. `scenery.ts` owns building layouts, fences,
materials, and procedural ground/sign textures. Shopping portals share a
half-tile width; roads share a fixed width and tangent-aligned endpoints. Buildings
sit within their tile, and separate Costco zones retain separate paved areas.
`warehouseLayout.ts` groups Costco zones by their actual edge connections. Each
tile contributes a roof section; joined portals remove both internal walls and
curbs. `warehouseGeometry.ts` batches the complete board's warehouses by material,
with continuous roof seams, exterior red fascia, one main entrance/sign per
complex, and loading bays on larger complexes. Entrance selection excludes
enclosed courtyards. Parking follows the perimeter and leaves road entrances clear.
The main board, current-tile preview, and placement ghost use the same footprints.
Warehouse geometry changes only when placed Costco topology changes, and its old
buffers are disposed on replacement. Fields and separately defined Costco zones
retain their original connections and claim anchors.

Grass has subtle meadow patches, trees vary in size and form small clusters,
and through-roads meander gently while retaining matching edge positions/tangents.
Road shoulders, curbs, and asphalt are painted across the whole network in
separate passes so intersections have no internal borders. Lane markings leave
junction centers clear, with stop lines on incoming lanes. Asphalt extends into
shopping lots while parking covers the shoulders at each driveway entrance.

### Landmarks, regions and night

`landmarks.ts` gives some tile types a man-made landmark in canonical tile space
(billboard, overlook, barn and silo, cul-de-sac houses, drive-thru menu board,
picnic table, lamps). `landmarkConflict()` keeps every landmark clear of roads,
lots, water, the restaurant and every follower anchor; a unit test enforces it.
Tile names describe what is drawn, never a landscape, because the same tile can
land in any region.

`regions.ts` is the single source of truth for regional landscapes. Seeded,
two-octave value noise in a rotated frame yields weights for meadow, farmland,
pine forest and desert. They sum to 1 and are forced to meadow within two tiles
of the origin. The seed is `GameState.sceneSeed` (scenery only; it never
affects rules). Each placed tile passes the weights at its four world corners to
the ground shader (`groundShader.ts`) as instanced attributes. Neighbours share
those corners, so there are no seams. The shader interpolates across the tile and
tints only where the per-type grass mask is white, so roads, lots, water and
painted markings keep their colours. Farmland adds world-space crop rows; desert
adds speckle.

`vegetation.ts` lists plant spots per tile type (tree, shrub, sapling). The board
draws them in one instanced mesh per species. Each spot's region is sampled from
the weights, so borders mingle: round trees and bushes in meadow, pines in
forest, hay bales and fences on farmland, cacti and red rocks in the desert. The
placement ghost and the tile preview always show meadow.

Solid-coloured props merge into one vertex-coloured mesh per tile type
(`paint.ts`). A second mesh holds windows and lamps. At night,
`SceneryLibrary.setNight()` turns on their emissive glow, and the warehouse
glass's too. Night lighting swaps the sun for a cool moon and darkens the
table; the UI switches palettes through `:root[data-time="night"]` tokens. The
choice is stored in `localStorage`, defaults to the system dark-mode setting, and
toggles from the HUD, the setup screen, or the `N` key.

Stored road/store claims use cardinal directions, and field claims use corners.
They are resolved to the matching feature before placing followers; the 2D and
3D views share that resolver. Claims match exact tile coordinates, including
negative positions. Feature anchors deliberately avoid centroids that could sit
inside another feature.
Claim markers keep these world-space anchors but render as a final transparent
overlay with depth testing and depth writing disabled. Their solid colour and
base ring stay visible through buildings, trees, and placement previews; farmers
retain their lying-down shape. Markers do not cast misleading scenery shadows.
Claim highlights clear on game-state changes, including when claiming or skipping
removes a focused button without blur. Missing features and empty highlight
polygons are ignored so stale selections cannot take down the 3D canvas.

## Rendering and interaction

Three.js 0.170 and React Three Fiber 8 support the existing React 18 application.
Each canvas owns and disposes its scenery library. Geometry is merged by material
within a tile type (all painted props share one material), then repeated tiles
are instanced across the board. At its fitted zoom, a full 63-tile board draws
about 150 calls and 46k triangles in the colour pass. Since three r186,
`renderer.info` also counts the shadow-map pass, so the e2e budget test reports
about 232 calls and 82k triangles for the same scene. A subtle
shader grid aligns to tile edges and fades out beyond the board, using one
additional draw call. The tile
gallery uses one canvas for every tile and rotation. The current-tile preview is
a second canvas, sharing the same model-building code and camera angle. It stays
mounted (hidden while claiming) and reuses its library across turns, avoiding
repeated WebGL context creation and delayed teardown.

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
error boundary fall back to classic rendering without resetting the game. Preview
failures fall back only within the preview; a healthy board stays in 3D. Context
loss from a detached or inactive canvas during teardown is ignored.

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
- `/e2e/warehouses.html?example=0` through `4` shows the straight, L-shaped,
  four-tile courtyard, separate-zone, and gas-station prototypes. Add/remove
  controls exercise live joins and GPU geometry cleanup. These layouts are also
  available in the Connected Warehouses Storybook story.

The headless Linux Chromium/SwiftShader check measures draw calls, triangles,
and idle-frame stability; software-renderer timing is not a hardware FPS benchmark.
The target is smooth 60 fps desktop / 30 fps tablet navigation. Physical tablet
and GPU performance must still be measured on those devices before claiming that
target has been met.

Coverage combines the unit and Storybook browser suites because jsdom cannot
exercise WebGL. `npm run test:coverage` writes `coverage/combined/index.html` and
enforces the 80% line, statement, function, and branch targets on that merged
report. `npm run test:coverage:unit` produces the faster unit-only report.
