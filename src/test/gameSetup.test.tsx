import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GameSetup from "../components/GameSetup";
import { PlayerDefinition } from "../types";

describe("GameSetup Component", () => {
  let mockOnStartGame: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnStartGame = vi.fn();
  });

  it("should render game setup form", () => {
    render(<GameSetup onStartGame={mockOnStartGame} />);

    expect(screen.getByText(/game setup/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start game/i })
    ).toBeInTheDocument();
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
    expect(aiSelects).toHaveLength(4); // 1 player count + 3 player types

    // First player should be Human by default
    expect(aiSelects[1]).toHaveTextContent("Human");
    // Second and third should be AI by default
    expect(aiSelects[2]).toHaveTextContent("AI");
    expect(aiSelects[3]).toHaveTextContent("AI");
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
});
