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

  it("should allow adding players", async () => {
    const user = userEvent.setup();
    render(<GameSetup onStartGame={mockOnStartGame} />);

    const addPlayerButton = screen.getByRole("button", { name: /add player/i });
    await user.click(addPlayerButton);

    // Should have at least one player input field
    const nameInputs = screen.getAllByLabelText(/player.*name/i);
    expect(nameInputs.length).toBeGreaterThan(0);
  });

  it("should validate minimum players before starting", async () => {
    const user = userEvent.setup();
    render(<GameSetup onStartGame={mockOnStartGame} />);

    const startButton = screen.getByRole("button", { name: /start game/i });
    await user.click(startButton);

    // Should not call onStartGame with invalid configuration
    expect(mockOnStartGame).not.toHaveBeenCalled();
  });

  it("should call onStartGame with valid configuration", async () => {
    const user = userEvent.setup();
    render(<GameSetup onStartGame={mockOnStartGame} />);

    // Add minimum required players
    const addPlayerButton = screen.getByRole("button", { name: /add player/i });
    await user.click(addPlayerButton);
    await user.click(addPlayerButton);

    // Fill in player names
    const nameInputs = screen.getAllByLabelText(/player.*name/i);
    if (nameInputs.length >= 2) {
      await user.type(nameInputs[0], "Alice");
      await user.type(nameInputs[1], "Bob");
    }

    const startButton = screen.getByRole("button", { name: /start game/i });
    await user.click(startButton);

    await waitFor(() => {
      expect(mockOnStartGame).toHaveBeenCalled();
    });

    const calledWith = mockOnStartGame.mock.calls[0][0] as PlayerDefinition[];
    expect(Array.isArray(calledWith)).toBe(true);
    expect(calledWith.length).toBeGreaterThanOrEqual(2);
  });

  it("should allow configuring AI players", async () => {
    const user = userEvent.setup();
    render(<GameSetup onStartGame={mockOnStartGame} />);

    // Add a player
    const addPlayerButton = screen.getByRole("button", { name: /add player/i });
    await user.click(addPlayerButton);

    // Look for AI checkbox/toggle
    const aiToggle = screen.getByLabelText(/ai|computer/i);
    if (aiToggle) {
      await user.click(aiToggle);
      expect(aiToggle).toBeChecked();
    }
  });

  it("should allow customizing player colors", async () => {
    const user = userEvent.setup();
    render(<GameSetup onStartGame={mockOnStartGame} />);

    const addPlayerButton = screen.getByRole("button", { name: /add player/i });
    await user.click(addPlayerButton);

    // Look for color picker input
    const colorInput = screen.getByDisplayValue(/#[0-9A-Fa-f]{6}/);
    if (colorInput) {
      await user.clear(colorInput);
      await user.type(colorInput, "#FF5733");
      expect(colorInput).toHaveValue("#FF5733");
    }
  });
});
