import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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

// Exercise the real game and claim controls without requiring WebGL in jsdom.
vi.mock("@/components/BoardView", () => ({
  CurrentTilePreview: () => null,
  BoardView: ({ state, highlightedFeature, onTilePlace }: ComponentProps<typeof BoardView>) => {
    const position = boardSnapshot(state).legal[0];
    return <div>
      <output data-testid="highlight">{highlightedFeature?.identifier ?? "none"}</output>
      <button disabled={!position} onClick={() => onTilePlace(position)}>Place test tile</button>
    </div>;
  },
}));

const players = [
  { id: "one", name: "One", color: "#437eaf" },
  { id: "two", name: "Two", color: "#d76543" },
];

function placeTile() {
  for (let rotation = 0; rotation < 4 && screen.getByRole("button", { name: "Place test tile" }).hasAttribute("disabled"); rotation++) {
    fireEvent.click(screen.getByTitle("Rotate Clockwise"));
  }
  expect(screen.getByRole("button", { name: "Place test tile" })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: "Place test tile" }));
}

describe("claim highlight lifetime", () => {
  it.each(["claim", "skip"])("clears a selected Costco when %s removes the controls without blur or mouseleave", (action) => {
    render(<GameBoard players={players} onReset={() => {}} />);
    let button: HTMLElement | undefined;
    for (let turn = 0; turn < 20 && !button; turn++) {
      placeTile();
      button = screen.queryAllByRole("button", { name: /^Claim costco/ })[0];
      if (!button) fireEvent.click(screen.getByRole("button", { name: /Skip Claiming/ }));
    }
    expect(button).toBeDefined();
    fireEvent.mouseEnter(button!);
    fireEvent.focus(button!);
    expect(screen.getByTestId("highlight")).toHaveTextContent("costco_");
    // Removing a focused/hovered node need not dispatch blur or mouseleave.
    if (action === "claim") fireEvent.click(button!);
    else fireEvent.keyDown(window, { key: "s" });
    expect(screen.getByTestId("highlight")).toHaveTextContent("none");
    placeTile();
    expect(screen.getByTestId("highlight")).toHaveTextContent("none");
  });
});
