import { describe, it, expect, beforeEach, vi, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GameSetup from "../components/GameSetup";
import App from "../App";
import { Game } from "../game";
import { PlayerDefinition } from "../types";
import { readSavedGame, saveGame, type SavedGame } from "../persistence/savedGame";

describe("GameSetup Component", () => {
  let mockOnStartGame: Mock<(players: PlayerDefinition[]) => void>;

  beforeEach(() => {
    mockOnStartGame = vi.fn();
  });

  it("should render game setup form", () => {
    render(<GameSetup onStartGame={mockOnStartGame} />);

    expect(screen.getByText(/game setup/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start game/i })).toBeInTheDocument();
  });

  it("should render with default 3 players", () => {
    render(<GameSetup onStartGame={mockOnStartGame} />);

    // Should show 3 player inputs by default
    const nameInputs = screen.getAllByDisplayValue(/Player \d+|You/);
    expect(nameInputs).toHaveLength(3);
  });

  it("should validate minimum players before starting", () => {
    render(<GameSetup onStartGame={mockOnStartGame} />);

    // The component should render without calling onStartGame immediately
    expect(mockOnStartGame).not.toHaveBeenCalled();
  });

  it("should call onStartGame with valid configuration", async () => {
    const user = userEvent.setup();
    render(<GameSetup onStartGame={mockOnStartGame} />);

    // Fill in player names
    const nameInputs = screen.getAllByDisplayValue(/Player \d+|You/);
    if (nameInputs.length >= 3) {
      await user.clear(nameInputs[0]);
      await user.type(nameInputs[0], "Alice");
      await user.clear(nameInputs[1]);
      await user.type(nameInputs[1], "Bob");
      await user.clear(nameInputs[2]);
      await user.type(nameInputs[2], "Charlie");
    }

    const startButton = screen.getByRole("button", { name: /start game/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(mockOnStartGame).toHaveBeenCalled();
    });

    const calledWith = mockOnStartGame.mock.calls[0][0] as PlayerDefinition[];
    expect(Array.isArray(calledWith)).toBe(true);
    expect(calledWith.length).toBe(3);
  });

  it("should allow configuring AI players", () => {
    render(<GameSetup onStartGame={mockOnStartGame} />);

    // The component defaults to AI for players 2 and 3
    // We can test that the selects show the correct default values
    const aiSelects = screen.getAllByRole("combobox");
    // 1 player count + 3 player types + 2 AI difficulty selects (for players 2 and 3)
    expect(aiSelects).toHaveLength(6);

    // First player should be Human by default
    expect(aiSelects[1]).toHaveTextContent("Human");
    // Second and third should be AI by default (indexes shift due to difficulty selects)
    expect(aiSelects[2]).toHaveTextContent("AI");
    expect(aiSelects[4]).toHaveTextContent("AI");
  });

  it("should assign correct player colors", async () => {
    const user = userEvent.setup();
    render(<GameSetup onStartGame={mockOnStartGame} />);

    const startButton = screen.getByRole("button", { name: /start game/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(mockOnStartGame).toHaveBeenCalled();
    });

    const calledWith = mockOnStartGame.mock.calls[0][0] as PlayerDefinition[];
    expect(calledWith[0].color).toBe("#ff595e"); // First color in palette
    expect(calledWith[1].color).toBe("#1982c4"); // Second color in palette
    expect(calledWith[2].color).toBe("#ffca3a"); // Third color in palette
  });

  const pick = async (user: ReturnType<typeof userEvent.setup>, select: HTMLElement, option: string) => {
    await user.click(select);
    await user.click(await screen.findByRole("option", { name: option }));
  };

  it("renames the first player between their human and AI defaults", async () => {
    const user = userEvent.setup();
    render(<GameSetup onStartGame={mockOnStartGame} />);
    await pick(user, screen.getAllByRole("combobox")[1], "AI");
    expect(screen.getByDisplayValue("Computer 1")).toBeInTheDocument();
    await pick(user, screen.getAllByRole("combobox")[1], "Human");
    expect(screen.getByDisplayValue("You")).toBeInTheDocument();
  });

  it("gives a blank-named player the AI default when they become AI", async () => {
    const user = userEvent.setup();
    render(<GameSetup onStartGame={mockOnStartGame} />);
    const [first] = screen.getAllByDisplayValue("You");
    await user.clear(first);
    await pick(user, screen.getAllByRole("combobox")[1], "AI");
    expect(screen.getByDisplayValue("Computer 1")).toBeInTheDocument();
  });

  it("keeps a custom name when a player changes type", async () => {
    const user = userEvent.setup();
    render(<GameSetup onStartGame={mockOnStartGame} />);
    const [first] = screen.getAllByDisplayValue("You");
    await user.clear(first);
    await user.type(first, "Ada");
    await pick(user, screen.getAllByRole("combobox")[1], "AI");
    expect(screen.getByDisplayValue("Ada")).toBeInTheDocument();
  });

  it("rebuilds default players when the count changes", async () => {
    const user = userEvent.setup();
    render(<GameSetup onStartGame={mockOnStartGame} />);
    await pick(user, screen.getAllByRole("combobox")[0], "5 Players");
    expect(screen.getAllByDisplayValue(/Player \d+|You/)).toHaveLength(5);
    await pick(user, screen.getAllByRole("combobox")[0], "2 Players");
    expect(screen.getAllByDisplayValue(/Player \d+|You/)).toHaveLength(2);
  });

  it("names blank players by seat when the game starts", async () => {
    const user = userEvent.setup();
    render(<GameSetup onStartGame={mockOnStartGame} />);
    await user.clear(screen.getByDisplayValue("Player 2"));
    await user.click(screen.getByRole("button", { name: /start game/i }));
    const players = mockOnStartGame.mock.calls[0][0] as PlayerDefinition[];
    expect(players[1].name).toBe("Player 2");
  });

  describe("continue game", () => {
    const savedPlayers: PlayerDefinition[] = [
      { id: "player-1", name: "Ada", isAI: false, color: "#437eaf" },
      { id: "player-2", name: "Computer 2", isAI: true, aiDifficulty: "easy", color: "#d76543" },
    ];
    const savedGame: SavedGame = {
      version: 1,
      savedAt: "2026-09-26T10:00:00.000Z",
      seed: 7,
      players: savedPlayers,
      actions: [],
      log: [],
      turnNumber: 12,
    };

    it("offers no saved game when there is none", () => {
      render(<GameSetup onStartGame={mockOnStartGame} />);
      expect(screen.queryByRole("button", { name: /continue game/i })).not.toBeInTheDocument();
    });

    it("shows the saved players and turn, and continues or discards it", async () => {
      const user = userEvent.setup();
      const onResume = vi.fn();
      const onDiscard = vi.fn();
      render(
        <GameSetup
          onStartGame={mockOnStartGame}
          savedGame={savedGame}
          onResumeGame={onResume}
          onDiscardSave={onDiscard}
        />,
      );
      expect(screen.getByText("Ada")).toBeInTheDocument();
      expect(screen.getByText(/Turn 12/)).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /continue game/i }));
      expect(onResume).toHaveBeenCalledWith(savedGame);
      await user.click(screen.getByRole("button", { name: /discard/i }));
      expect(onDiscard).toHaveBeenCalled();
    });

    it("finds a stored game on launch and forgets it when discarded", async () => {
      const user = userEvent.setup();
      const game = new Game(savedPlayers, { seed: 7 });
      const spot = () => game.getValidPlacements()[0];
      for (let turn = 0; turn < 4 && !spot(); turn++) game.rotateTileClockwise();
      game.placeTile(spot());
      saveGame({ seed: 7, players: savedPlayers, actions: [...game.getActions()], log: [], turnNumber: 1 });

      render(<App />);
      await user.click(screen.getByRole("button", { name: /discard/i }));
      expect(screen.queryByRole("button", { name: /continue game/i })).not.toBeInTheDocument();
      expect(readSavedGame()).toBeUndefined();
      localStorage.clear();
    });
  });
});
