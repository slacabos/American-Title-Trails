import type { Meta, StoryObj } from "@storybook/react-vite";
import { Game } from "@/game";
import { GamePhase } from "@/types";
import Scoreboard from "./Scoreboard";
import TileDock from "./TileDock";
import ActivityLog from "./ActivityLog";

const players = [
  { id: "blue", name: "Blue", color: "#457da1" },
  { id: "red", name: "Red", color: "#cc5d44", isAI: true, aiDifficulty: "hard" as const },
  { id: "gold", name: "Gold", color: "#d6a03a" },
];

function gameAt(phase: "place" | "claim" | "ai") {
  const game = new Game(players, { seed: 17 });
  if (phase === "place") return game;
  // Blue places a tile; the AI's turn follows once Blue is done claiming.
  for (let turn = 0; turn < 4 && game.getValidPlacements().length === 0; turn++) game.rotateTileClockwise();
  game.placeTile(game.getValidPlacements()[0]);
  if (phase === "ai" && game.getState().phase === GamePhase.CLAIM_FEATURE) game.skipClaim();
  return game;
}

const noop = () => {};

function Dock({ phase }: { phase: "place" | "claim" | "ai" }) {
  const game = gameAt(phase);
  const state = game.getState();
  return (
    <div style={{ width: 288 }}>
      <TileDock
        state={state}
        claimableFeatures={
          state.phase === GamePhase.CLAIM_FEATURE ? game.getClaimableFeaturesForCurrentTurn() : []
        }
        onRotateClockwise={noop}
        onRotateCounterClockwise={noop}
        onClaim={noop}
        onSkip={noop}
        onTakeBack={state.phase === GamePhase.CLAIM_FEATURE ? noop : undefined}
        onHighlight={noop}
      />
    </div>
  );
}

const meta: Meta = {
  title: "Game/HUD",
  parameters: { layout: "centered", backgrounds: { default: "scene", values: [{ name: "scene", value: "#c8cfbb" }] } },
};
export default meta;
type Story = StoryObj;

export const ScoreboardPanel: Story = {
  render: () => {
    const game = gameAt("ai");
    const state = game.getState();
    return (
      <div style={{ width: 272 }}>
        <Scoreboard
          players={state.players}
          currentPlayerIndex={state.currentPlayerIndex}
          board={state.board}
          turnNumber={state.turnNumber}
          tileStats={game.getTileStats()}
          isGameOver={false}
        />
      </div>
    );
  },
};

export const DockPlacing: Story = { render: () => <Dock phase="place" /> };
export const DockClaiming: Story = { render: () => <Dock phase="claim" /> };
export const DockAITurn: Story = { render: () => <Dock phase="ai" /> };

const entries = [
  { id: 3, time: "10:42", message: "Blue claimed road (Route 66)" },
  { id: 2, time: "10:41", message: "Blue placed tile at (1, 0)" },
  { id: 1, time: "10:40", message: "Game started!" },
];

export const ActivityLogPanel: Story = { render: () => <ActivityLog entries={entries} /> };
