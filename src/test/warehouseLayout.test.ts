import { describe, expect, it } from "vitest";
import { buildDeck } from "@/tileLibrary";
import { warehouseExamples } from "./fixtures/warehouseExamples";
import { warehouseFootprint, warehouseLayout, warehouseLayoutKey, WAREHOUSE_WIDTH } from "@/rendering/warehouseLayout";
import { insidePolygon, PORTALS, rotatePoint, zonePolygon } from "@/rendering/tileLayout";
import type { TileRecord } from "@/types";

describe("connected warehouse layout", () => {
  it.each(warehouseExamples)("joins the correct features in $name", ({ records, complexes }) => {
    const layout = warehouseLayout(records);
    expect(layout).toHaveLength(complexes);
    expect(layout.flatMap((complex) => complex.sections)).toHaveLength(
      records.reduce((count, record) => count + record.tile.costcoZones.length, 0),
    );
    for (const complex of layout) {
      expect(complex.entrance).toBeDefined();
      expect(complex.sections.some((section) => section.walls.includes(complex.entrance))).toBe(true);
      for (const section of complex.sections)
        for (const edge of section.joined) {
          expect(section.walls.some((wall) => wall.portal === edge)).toBe(false);
          expect(section.curbs.some((wall) => wall.portal === edge)).toBe(false);
        }
    }
  });

  it("replaces a boundary wall with a shared roof connection when a neighbor is placed", () => {
    const [first, second] = warehouseExamples[0].records;
    const before = warehouseLayout([first]);
    expect(before[0].sections[0].walls.some((wall) => wall.portal === "east")).toBe(true);
    const after = warehouseLayout([first, second]);
    expect(after).toHaveLength(1);
    const left = after[0].sections.find((section) => section.key.startsWith("0,0:"))!;
    const right = after[0].sections.find((section) => section.key.startsWith("1,0:"))!;
    expect(left.joined).toContain("east");
    expect(right.joined).toContain("west");
    expect(
      left.roof
        .filter(([x]) => x === 0.5)
        .map(([, z]) => z)
        .sort(),
    ).toEqual(
      right.roof
        .filter(([x]) => x === 0.5)
        .map(([, z]) => z)
        .sort(),
    );
    expect(after[0].loadingBay).toBeDefined();
  });

  it("handles all store portals at every rotation and keeps roofs on paved terrain", () => {
    const unique = [...new Map(buildDeck().map((tile) => [tile.id, tile])).values()];
    for (const tile of unique)
      for (let turns = 0; turns < 4; turns++) {
        const rotated = tile.rotate(turns);
        rotated.costcoZones.forEach((zone, i) => {
          const roof = warehouseFootprint(rotated, i);
          const paving = zonePolygon(rotated, i);
          const center = roof.reduce(
            ([x, z], point) => [x + point[0] / roof.length, z + point[1] / roof.length],
            [0, 0],
          );
          for (const [x, z] of roof) {
            expect(insidePolygon([x * 0.999 + center[0] * 0.001, z * 0.999 + center[1] * 0.001], paving)).toBe(true);
          }
          for (const edge of zone.segments) {
            if (edge === "center") continue;
            const [x, z] = PORTALS[edge];
            const portal = roof.filter((p) => (x ? p[0] === x : p[1] === z));
            expect(portal).toHaveLength(2);
            expect(Math.hypot(portal[0][0] - portal[1][0], portal[0][1] - portal[1][1])).toBeCloseTo(WAREHOUSE_WIDTH);
          }
        });
      }
  });

  it("preserves connections when a complete board rotates or moves to negative coordinates", () => {
    const example = warehouseExamples[2];
    for (let turns = 0; turns < 4; turns++) {
      const records = example.records.map(({ tile, position }) => {
        const [x, y] = rotatePoint([position.x, position.y], turns);
        return { tile: tile.rotate(turns), position: { x: x - 3, y: y - 5 } };
      });
      const result = warehouseLayout(records);
      expect(result).toHaveLength(1);
      expect(result[0].sections.every((section) => section.joined.length === 2)).toBe(true);
    }
  });

  it("places the four-tile complex entrance outside its enclosed courtyard", () => {
    const { entrance } = warehouseLayout(warehouseExamples[2].records)[0];
    const midpoint = [(entrance.a[0] + entrance.b[0]) / 2, (entrance.a[1] + entrance.b[1]) / 2];
    const towardOutside = (midpoint[0] - 0.5) * entrance.normal[0] + (midpoint[1] - 0.5) * entrance.normal[1];
    expect(towardOutside).toBeGreaterThan(0);
  });

  it("does not join nonmatching or merely nearby sections", () => {
    const first = warehouseExamples[0].records[0];
    const records: TileRecord[] = [first, { tile: first.tile.rotate(1), position: { x: 1, y: 0 } }];
    expect(warehouseLayout(records)).toHaveLength(2);
    records[1] = { tile: first.tile, position: { x: 1.1, y: 0 } };
    expect(warehouseLayout(records)).toHaveLength(2);
    expect(warehouseLayout([])).toEqual([]);
    expect(warehouseFootprint(first.tile, 99)).toEqual([]);
  });

  it("has a stable topology key regardless of record order", () => {
    const records = warehouseExamples[1].records;
    expect(warehouseLayoutKey(records)).toBe(warehouseLayoutKey([...records].reverse()));
    expect(warehouseLayoutKey(records)).not.toBe(warehouseLayoutKey(records.slice(1)));
  });
});
