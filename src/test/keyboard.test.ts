import { afterEach, describe, expect, it } from "vitest";
import {
  activatesOnEnter,
  arrowDirection,
  directionKey,
  isArrowKey,
  isTypingTarget,
  nearestLegal,
  nextLegal,
  SHORTCUT_GROUPS,
  SHORTCUTS,
} from "@/rendering/keyboard";
import en from "@/content/translations/en.json";

const at = (x: number, y: number) => ({ x, y });
const target = (element: Element) => ({ target: element }) as Pick<KeyboardEvent, "target">;

afterEach(() => {
  document.body.innerHTML = "";
});

describe("arrow directions", () => {
  it("follow the compass in drone view", () => {
    expect(arrowDirection("ArrowUp", "drone")).toEqual([0, -1]);
    expect(arrowDirection("ArrowDown", "drone")).toEqual([-0, 1]);
    expect(arrowDirection("ArrowRight", "drone")).toEqual([1, 0]);
    expect(arrowDirection("ArrowLeft", "drone")).toEqual([-1, -0]);
  });

  it("follow the screen on the diagonal tabletop", () => {
    const [ux, uy] = arrowDirection("ArrowUp", "tabletop");
    expect(ux).toBeCloseTo(-Math.SQRT1_2);
    expect(uy).toBeCloseTo(-Math.SQRT1_2);
    const [rx, ry] = arrowDirection("ArrowRight", "tabletop");
    expect(rx).toBeCloseTo(Math.SQRT1_2);
    expect(ry).toBeCloseTo(-Math.SQRT1_2);
  });

  it("map WASD onto the arrows, in either case", () => {
    expect(["w", "a", "s", "d", "W", "D"].map(directionKey)).toEqual([
      "ArrowUp",
      "ArrowLeft",
      "ArrowDown",
      "ArrowRight",
      "ArrowUp",
      "ArrowRight",
    ]);
    expect(directionKey("ArrowLeft")).toBe("ArrowLeft");
    expect(["e", "q", "x", "Enter"].map(directionKey)).toEqual([undefined, undefined, undefined, undefined]);
  });

  it("recognise only the four arrows", () => {
    expect(["ArrowUp", "ArrowLeft", "Enter", "w"].map(isArrowKey)).toEqual([true, true, false, false]);
  });
});

describe("nextLegal", () => {
  const legal = [at(1, 0), at(3, 0), at(2, 1), at(0, -2), at(-1, 0)];

  it("moves to the nearest spot straight ahead", () => {
    expect(nextLegal(at(0, 0), legal, [1, 0])).toEqual(at(1, 0));
    expect(nextLegal(at(1, 0), legal, [1, 0])).toEqual(at(3, 0));
    expect(nextLegal(at(0, 0), legal, [-1, 0])).toEqual(at(-1, 0));
    expect(nextLegal(at(0, 0), legal, [0, -1])).toEqual(at(0, -2));
  });

  it("prefers an in-line spot over a nearer one off to the side", () => {
    expect(nextLegal(at(0, 0), [at(1, 2), at(3, 0)], [1, 0])).toEqual(at(3, 0));
  });

  it("ignores spots level with or behind the cursor", () => {
    expect(nextLegal(at(0, 0), [at(0, 3), at(-2, 0)], [1, 0])).toEqual(at(0, 0));
  });

  it("stays put when nothing is legal", () => {
    expect(nextLegal(at(4, 4), [], [0, 1])).toEqual(at(4, 4));
  });
});

describe("nearestLegal", () => {
  it("starts next to the last placed tile, or the origin", () => {
    const legal = [at(5, 5), at(1, 0), at(-3, 0)];
    expect(nearestLegal(legal)).toEqual(at(1, 0));
    expect(nearestLegal(legal, at(-2, 0))).toEqual(at(-3, 0));
    expect(nearestLegal([])).toBeUndefined();
  });
});

describe("focus guards", () => {
  it("treat fields, dropdowns and open dialogs as typing", () => {
    document.body.innerHTML =
      '<input id="i"><div role="combobox" id="c"></div><button id="b"></button><main id="m"></main>';
    expect(isTypingTarget(target(document.getElementById("i")!))).toBe(true);
    expect(isTypingTarget(target(document.getElementById("c")!))).toBe(true);
    expect(isTypingTarget(target(document.getElementById("b")!))).toBe(false);
    expect(isTypingTarget(target(document.getElementById("m")!))).toBe(false);
    document.body.insertAdjacentHTML("beforeend", '<div role="dialog"></div>');
    expect(isTypingTarget(target(document.getElementById("m")!))).toBe(true);
  });

  it("let focused buttons, links and menu items keep Enter and Space", () => {
    document.body.innerHTML =
      '<button id="b"><span id="s"></span></button><a href="#" id="a"></a><div role="menuitem" id="mi"></div><main id="m"></main>';
    for (const id of ["b", "s", "a", "mi"]) expect(activatesOnEnter(target(document.getElementById(id)!))).toBe(true);
    expect(activatesOnEnter(target(document.getElementById("m")!))).toBe(false);
  });
});

describe("shortcut list", () => {
  const label = (key: string) =>
    key.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], en);

  it("has a translated title for every group and label for every shortcut", () => {
    for (const group of SHORTCUT_GROUPS) {
      expect(typeof label(group.title), group.title).toBe("string");
      for (const { action } of group.shortcuts) expect(typeof label(action), action).toBe("string");
    }
  });

  it("lists every shortcut exactly once", () => {
    const actions = SHORTCUTS.map(({ action }) => action);
    expect(new Set(actions).size).toBe(actions.length);
  });
});
