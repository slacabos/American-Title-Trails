# River opening

Every game starts with the current base-game River (C3): a source, ten shuffled middle tiles, then the lake with a monastery (McDonald's). The existing 51 land tiles follow. There are 63 tiles including the source; no setup switch is required.

## Placement and scoring

The source is preplaced at (0, 0), flowing south, without a follower. River tiles must extend the one open end and match every neighboring edge. Two consecutive bends cannot turn the same way, and a bend cannot reverse the source's flow direction. The lake closes the river on a normal player turn.

Water cannot be claimed and scores no points. Roads cross rivers on bridges; fields remain separated by the water and road. Fields can reconnect around the source or lake. Farmers count only completed Costco features bordering their connected field.

A turn resolves in this order: place, optionally claim, score completed features, return followers, draw the next tile and advance the player. River II branches and abbot/garden scoring are excluded.

## Implementation

- `src/riverLibrary.ts`: all twelve authored tile topologies and field-to-Costco adjacency.
- `src/riverRules.ts`: additional placement checks, shared by humans, previews and AI.
- `src/rendering/riverLayout.ts`: shared water paths, building anchors and bridge routes.
- `src/rendering/riverCanvas.ts`: classic tile rendering. The same paths texture 3D scenery, with raised bridge geometry.
- `src/test/river.test.ts`: opening order, rotations, forbidden bends, bank topology, claims, scoring and full AI games.
- Storybook's River Tiles and All Tiles And Rotations show both renderers; Playwright checks every rotation, highlights and marker visibility.

The source and lake are separate from the shuffled middle stack. Water endpoints are derived from board topology, so previews and rotations use the same rules without storing a second river state.

## Rule references

- [Publisher tile inventory, page 5](https://cundco.de/media/27/80/67/1788783425/Die_Welt_von_Carcassonne.pdf?ts=1788783425): C3-FA through C3-FL.
- [Publisher River rules](https://cundco.de/media/db/e5/fa/1715104325/cc-3-0-rules-supplemental.pdf).
- [Publisher Big Box rules, River clarification](https://cundco.de/media/26/95/90/1773929268/CC_BigBox_3.1_rule.pdf?ts=1773929331): consecutive bends and source-flow restriction.
