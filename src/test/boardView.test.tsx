import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { Game } from "@/game";
import { BoardView, CurrentTilePreview, ViewToggle } from "@/components/BoardView";
import type { CameraView } from "@/rendering/cameraView";

// jsdom has no WebGL: stand in for the lazily loaded 3D scenes.
const scene = vi.hoisted(() => ({ fail: false, previewFail: false, mounts: 0 }));
vi.mock("@/components/three/BoardScene", () => ({
  BoardScene: ({ view }: { view: string }) => {
    if (scene.fail) throw new Error("no WebGL");
    scene.mounts++;
    return <div data-testid="scene">{view}</div>;
  },
  TilePreviewScene: () => {
    if (scene.previewFail) throw new Error("no WebGL");
    return <div className="tabletop-tile-preview" data-testid="preview" />;
  },
}));

const state = new Game([
  { id: "a", name: "A", color: "#437eaf" },
  { id: "b", name: "B", color: "#d76543" },
], { seed: 3 }).getState();

function Harness({ onRetry = () => {} }: { onRetry?: () => void }) {
  const [unavailable, setUnavailable] = useState(false);
  return (
    <BoardView
      state={state}
      view="drone"
      onTilePlace={() => {}}
      onUnavailable={() => setUnavailable(true)}
      unavailable={unavailable}
      onRetry={() => {
        onRetry();
        setUnavailable(false);
      }}
    />
  );
}

beforeEach(() => {
  scene.fail = false;
  scene.previewFail = false;
  scene.mounts = 0;
  // The graphics boundary logs the caught renderer error by design.
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("BoardView", () => {
  it("renders the 3D scene with the chosen camera view", async () => {
    render(<Harness />);
    expect(await screen.findByTestId("scene")).toHaveTextContent("drone");
  });

  it("swaps a failed renderer for a retry panel, and retrying remounts it", async () => {
    scene.fail = true;
    const onRetry = vi.fn();
    render(<Harness onRetry={onRetry} />);
    expect(await screen.findByText("3D graphics aren't available right now")).toBeInTheDocument();
    expect(screen.queryByTestId("scene")).toBeNull();

    scene.fail = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(await screen.findByTestId("scene")).toBeInTheDocument();
    expect(scene.mounts).toBeGreaterThan(0);
  });
});

describe("ViewToggle", () => {
  it("marks the active view and reports changes", () => {
    const onViewChange = vi.fn<(view: CameraView) => void>();
    render(<ViewToggle view="tabletop" onViewChange={onViewChange} />);
    expect(screen.getByRole("button", { name: "Tabletop" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Drone" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "Drone" }));
    expect(onViewChange).toHaveBeenCalledWith("drone");
  });
});

describe("CurrentTilePreview", () => {
  it("shows the 3D preview for the current tile", async () => {
    render(<CurrentTilePreview tile={state.currentTile} />);
    expect(await screen.findByTestId("preview")).toBeInTheDocument();
  });

  it("hides only itself when its renderer fails", async () => {
    scene.previewFail = true;
    const { container } = render(<CurrentTilePreview tile={state.currentTile} />);
    await vi.waitFor(() => expect(console.error).toHaveBeenCalled());
    expect(screen.queryByTestId("preview")).toBeNull();
    expect(container.querySelector("div")).toBeEmptyDOMElement();
  });

  it("stays mounted but hidden when there is no tile", () => {
    const { container } = render(<CurrentTilePreview tile={undefined} />);
    expect(container.querySelector("div")).not.toBeVisible();
  });
});
