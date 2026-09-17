import type { ITile } from "./interfaces/ITile";
import type { Direction, Position, TileRecord } from "./types";
import { DELTAS, DIRECTIONS, OPPOSITE } from "./directions";

const positionKey = ({ x, y }: Position): string => `${x},${y}`;

/** Additional River rules shared by placement, previews, and AI. */
export function riverPlacementError(records: Map<string, TileRecord>, tile: ITile, position: Position): string | undefined {
  const river = [...records.values()].filter(record => record.tile.river);
  if (!river.length) {
    return tile.river && (tile.river.kind !== "source" || records.size > 0) ? "riverStart" : undefined;
  }
  if (tile.river?.kind === "source") return "riverStart";
  const source = river.find(record => record.tile.river?.kind === "source");
  const open = river.flatMap(record => record.tile.river!.edges.flatMap(edge => {
    const delta = DELTAS[edge];
    const next = { x: record.position.x + delta.x, y: record.position.y + delta.y };
    return records.has(positionKey(next)) ? [] : [{ record, edge, next }];
  }));
  if (!open.length) return tile.river ? "riverFinished" : undefined;
  if (!tile.river || open.length !== 1) return "riverContinue";
  const head = open[0];
  const incoming = OPPOSITE[head.edge];
  if (position.x !== head.next.x || position.y !== head.next.y || !tile.river.edges.includes(incoming)) return "riverContinue";
  const outgoing = tile.river.edges.find(edge => edge !== incoming);
  if (!outgoing) return undefined; // The lake caps the one open end.
  const turn = (from: Direction, to: Direction) => (DIRECTIONS.indexOf(to) - DIRECTIONS.indexOf(from) + 4) % 4;
  const bend = turn(head.edge, outgoing);
  if (bend !== 0) {
    if (source && outgoing === OPPOSITE[source.tile.river!.edges[0]]) return "riverBackwards";
    const previousIncoming = head.record.tile.river!.edges.find(edge => edge !== head.edge);
    if (previousIncoming && turn(OPPOSITE[previousIncoming], head.edge) === bend) return "riverUTurn";
  }
  return undefined;
}
