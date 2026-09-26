import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import GameBoard from "@/components/GameBoard";
import type { BoardView } from "@/components/BoardView";
import { boardSnapshot } from "@/rendering/tileLayout";

vi.mock("@/game", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/game")>();
  const { Game } = actual;
  return { ...actual, Game: class extends Game {
    constructor(players: ConstructorParameters<typeof Game>[0]) {
      super(players, { seed: 17 });
    }
  } };
});

// Expose what the 3D board would show: the cursor, the highlighted feature,
// the camera view and the legal spaces for the current rotation.
vi.mock("@/components/BoardView", () => ({
  CurrentTilePreview: () => null,
  BoardStatus: () => null,
  ViewToggle: () => null,
  BoardView: ({ state, cursor, highlightedFeature, view }: ComponentProps<typeof BoardView>) => (
    <div>
      <output data-testid="cursor">{cursor ? `${cursor.x},${cursor.y}` : "none"}</output>
      <output data-testid="legal">{boardSnapshot(state).legal.map(({ x, y }) => `${x},${y}`).join(" ")}</output>
      <output data-testid="highlight">{highlightedFeature?.identifier ?? "none"}</output>
      <output data-testid="view">{view}</output>
      <output data-testid="tiles">{state.board.getAllTiles().size}</output>
    </div>
  ),
}));

const players = [
  { id: "one", name: "One", color: "#437eaf" },
  { id: "two", name: "Two", color: "#d76543" },
];

const key = (k: string, init: KeyboardEventInit = {}) =>
  act(() => {
    fireEvent.keyDown(document.body, { key: k, ...init });
  });
const text = (id: string) => screen.getByTestId(id).textContent;
const legal = () => text("legal")!.split(" ").filter(Boolean);

/** Rotate with E until the tile fits somewhere, then put the cursor on it. */
function aimCursor() {
  for (let turn = 0; turn < 4 && legal().length === 0; turn++) key("e");
  expect(legal().length).toBeGreaterThan(0);
  key("ArrowDown");
  expect(legal()).toContain(text("cursor"));
}

beforeEach(() => localStorage.clear());

describe("keyboard play", () => {
  it("places a tile with the arrows and Enter", () => {
    render(<GameBoard players={players} onReset={() => {}} />);
    expect(text("cursor")).toBe("none");
    aimCursor();
    key("Enter");
    expect(text("tiles")).toBe("2");
    // The cursor belongs to the turn that is now over.
    expect(text("cursor")).toBe("none");
  });

  it("keeps the cursor on a legal space when the tile rotates", () => {
    render(<GameBoard players={players} onReset={() => {}} />);
    aimCursor();
    for (let turn = 0; turn < 4; turn++) {
      key(turn % 2 ? "q" : "e");
      const cursor = text("cursor");
      if (legal().length) expect(legal()).toContain(cursor);
      else expect(cursor).toBe("none");
    }
  });

  it("chooses a claim with Up/Down and claims it with Enter", () => {
    render(<GameBoard players={players} onReset={() => {}} />);
    // Place until a turn offers claims, skipping the rest with S.
    for (let turn = 0; turn < 20; turn++) {
      aimCursor();
      key("Enter");
      if (screen.queryAllByRole("button", { name: /^(Claim|Place farmer)/ }).length) break;
      key("x");
    }
    const options = screen.getAllByRole("button", { name: /^(Claim|Place farmer)/ });
    key("ArrowDown");
    expect(text("highlight")).not.toBe("none");
    expect(options[0]).toHaveAttribute("aria-current", "true");
    if (options.length > 1) {
      key("ArrowDown");
      expect(options[1]).toHaveAttribute("aria-current", "true");
      key("ArrowUp");
    }
    expect(options[0]).toHaveAttribute("aria-current", "true");
    key("Enter");
    expect(screen.queryAllByRole("button", { name: /^(Claim|Place farmer)/ })).toHaveLength(0);
    expect(screen.getByText(/claimed/)).toBeInTheDocument();
  });

  it("claims an option directly with its number", () => {
    render(<GameBoard players={players} onReset={() => {}} />);
    for (let turn = 0; turn < 20; turn++) {
      aimCursor();
      key("Enter");
      if (screen.queryAllByRole("button", { name: /^(Claim|Place farmer)/ }).length) break;
      key("x");
    }
    key("1");
    expect(screen.queryAllByRole("button", { name: /^(Claim|Place farmer)/ })).toHaveLength(0);
    expect(screen.getByText(/claimed/)).toBeInTheDocument();
  });

  it("switches the camera view with V and clears the cursor with Escape", () => {
    render(<GameBoard players={players} onReset={() => {}} />);
    expect(text("view")).toBe("tabletop");
    key("v");
    expect(text("view")).toBe("drone");
    aimCursor();
    key("Escape");
    expect(text("cursor")).toBe("none");
  });

  it("leaves keys alone while help is open, and Ctrl+letter to the browser", () => {
    render(<GameBoard players={players} onReset={() => {}} />);
    key("?");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    key("ArrowDown");
    key("Enter");
    expect(text("cursor")).toBe("none");
    expect(text("tiles")).toBe("1");
    key("?");
    const before = legal().join(" ");
    key("e", { ctrlKey: true });
    expect(legal().join(" ")).toBe(before);
  });

  it("lets a focused button keep Enter", () => {
    render(<GameBoard players={players} onReset={() => {}} />);
    aimCursor();
    const rotate = screen.getByTitle("Rotate clockwise (E)");
    rotate.focus();
    act(() => {
      fireEvent.keyDown(rotate, { key: "Enter" });
    });
    expect(text("tiles")).toBe("1");
  });

  it("moves the cursor with WASD exactly like the arrows", () => {
    render(<GameBoard players={players} onReset={() => {}} />);
    aimCursor();
    const route = (keys: string[]) =>
      keys.map((k) => {
        key(k);
        return text("cursor");
      });
    const byArrows = route(["ArrowRight", "ArrowUp", "ArrowLeft", "ArrowDown"]);
    key("Escape");
    key("ArrowDown");
    const byWasd = route(["d", "w", "a", "s"]);
    expect(byWasd).toEqual(byArrows);
    // With Shift, WASD pans the camera and leaves the cursor alone.
    const cursor = text("cursor");
    key("W", { shiftKey: true });
    expect(text("cursor")).toBe(cursor);
  });

  it("rotates with Q and E only, and skips claims with X", () => {
    render(<GameBoard players={players} onReset={() => {}} />);
    const turn = () => legal().join(" ");
    const start = turn();
    key("r");
    expect(turn()).toBe(start);
    key("e");
    key("q");
    expect(turn()).toBe(start);
    for (let t = 0; t < 20; t++) {
      aimCursor();
      key("Enter");
      if (screen.queryAllByRole("button", { name: /^(Claim|Place farmer)/ }).length) break;
      key("x");
    }
    const options = screen.getAllByRole("button", { name: /^(Claim|Place farmer)/ });
    key("s");
    expect(options[0]).toHaveAttribute("aria-current", "true");
    key("x");
    expect(screen.queryAllByRole("button", { name: /^(Claim|Place farmer)/ })).toHaveLength(0);
    expect(screen.getByText(/skipped claiming/)).toBeInTheDocument();
  });
});
