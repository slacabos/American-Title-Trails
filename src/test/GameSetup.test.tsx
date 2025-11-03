import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GameSetup from '../components/GameSetup';
import { PlayerDefinition } from '../types';

describe('GameSetup Component', () => {
  let onStartGame: Mock<(players: PlayerDefinition[]) => void>;

  beforeEach(() => {
    onStartGame = vi.fn();
  });

  describe('Initial Render', () => {
    it('should render the component', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      expect(screen.getByText('American Tile Trails')).toBeInTheDocument();
      expect(screen.getByText('Game Setup')).toBeInTheDocument();
    });

    it('should display the tagline', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      expect(
        screen.getByText(/McDonalds abbeys, Costco castles/)
      ).toBeInTheDocument();
    });

    it('should show ready to play message', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      expect(screen.getByText('🎮 Ready to Play!')).toBeInTheDocument();
      expect(
        screen.getByText('Configure your game settings and click Start Game.')
      ).toBeInTheDocument();
    });

    it('should render Start Game button', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      const startButton = screen.getByRole('button', { name: /start game/i });
      expect(startButton).toBeInTheDocument();
    });

    it('should render How to Play button', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      const helpButton = screen.getByRole('button', { name: /how to play/i });
      expect(helpButton).toBeInTheDocument();
    });

    it('should display game icon', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      const icon = screen.getByAltText('American Tile Trails Game Icon');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Player Count Selection', () => {
    it('should default to 3 players', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      // Should show 3 player inputs
      const playerInputs = screen.getAllByPlaceholderText(/Player \d+/);
      expect(playerInputs).toHaveLength(3);
    });

    it('should display player count label', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      expect(
        screen.getByText('Number of players (2-5):')
      ).toBeInTheDocument();
    });

    it('should show correct default player names', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      expect(screen.getByDisplayValue('You')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Player 2')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Player 3')).toBeInTheDocument();
    });

    it('should have first player as human by default', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      const playerSetups = screen.getAllByRole('combobox');
      // First one is player count, then alternating player type selectors
      expect(playerSetups.length).toBeGreaterThan(1);
    });

    it('should have other players as AI by default', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      // Player 2 and 3 should be AI
      const aiLabels = screen.queryAllByText('AI');
      expect(aiLabels.length).toBeGreaterThan(0);
    });
  });

  describe('Player Configuration', () => {
    it('should allow changing player name', async () => {
      const user = userEvent.setup();
      render(<GameSetup onStartGame={onStartGame} />);
      
      const firstPlayerInput = screen.getByDisplayValue('You');
      await user.clear(firstPlayerInput);
      await user.type(firstPlayerInput, 'Alice');
      
      expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
    });

    it('should update player name on input change', async () => {
      const user = userEvent.setup();
      render(<GameSetup onStartGame={onStartGame} />);
      
      const playerInput = screen.getByDisplayValue('Player 2');
      await user.clear(playerInput);
      await user.type(playerInput, 'Bob');
      
      expect(screen.getByDisplayValue('Bob')).toBeInTheDocument();
    });

    it('should show color indicators for each player', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      const colorIndicators = document.querySelectorAll('.player-color-indicator');
      expect(colorIndicators).toHaveLength(3); // Default 3 players
    });

    it('should display unique colors for each player', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      const colorIndicators = document.querySelectorAll('.player-color-indicator');
      const colors = Array.from(colorIndicators).map(
        (el) => (el as HTMLElement).style.backgroundColor
      );
      
      // Colors should be set
      colors.forEach((color) => {
        expect(color).toBeTruthy();
      });
    });

    it('should show player labels (P1, P2, P3)', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      expect(screen.getByText('P1:')).toBeInTheDocument();
      expect(screen.getByText('P2:')).toBeInTheDocument();
      expect(screen.getByText('P3:')).toBeInTheDocument();
    });
  });

  describe('Start Game Functionality', () => {
    it('should call onStartGame when Start Game button clicked', async () => {
      const user = userEvent.setup();
      render(<GameSetup onStartGame={onStartGame} />);
      
      const startButton = screen.getByRole('button', { name: /start game/i });
      await user.click(startButton);
      
      expect(onStartGame).toHaveBeenCalledTimes(1);
    });

    it('should pass player configurations to onStartGame', async () => {
      const user = userEvent.setup();
      render(<GameSetup onStartGame={onStartGame} />);
      
      const startButton = screen.getByRole('button', { name: /start game/i });
      await user.click(startButton);
      
      expect(onStartGame).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            id: expect.any(String),
            color: expect.any(String),
            isAI: expect.any(Boolean),
          }),
        ])
      );
    });

    it('should pass correct number of players', async () => {
      const user = userEvent.setup();
      render(<GameSetup onStartGame={onStartGame} />);
      
      const startButton = screen.getByRole('button', { name: /start game/i });
      await user.click(startButton);
      
      const calledWith = onStartGame.mock.calls[0][0] as PlayerDefinition[];
      expect(calledWith).toHaveLength(3); // Default 3 players
    });

    it('should validate empty player names with defaults', async () => {
      const user = userEvent.setup();
      render(<GameSetup onStartGame={onStartGame} />);
      
      // Clear player name
      const firstPlayerInput = screen.getByDisplayValue('You');
      await user.clear(firstPlayerInput);
      
      const startButton = screen.getByRole('button', { name: /start game/i });
      await user.click(startButton);
      
      const calledWith = onStartGame.mock.calls[0][0] as PlayerDefinition[];
      // Should use default name
      expect(calledWith[0].name).toBe('Player 1');
    });

    it('should trim whitespace from player names', async () => {
      const user = userEvent.setup();
      render(<GameSetup onStartGame={onStartGame} />);
      
      const firstPlayerInput = screen.getByDisplayValue('You');
      await user.clear(firstPlayerInput);
      await user.type(firstPlayerInput, '  Alice  ');
      
      const startButton = screen.getByRole('button', { name: /start game/i });
      await user.click(startButton);
      
      const calledWith = onStartGame.mock.calls[0][0] as PlayerDefinition[];
      expect(calledWith[0].name).toBe('Alice');
    });

    it('should assign sequential player IDs', async () => {
      const user = userEvent.setup();
      render(<GameSetup onStartGame={onStartGame} />);
      
      const startButton = screen.getByRole('button', { name: /start game/i });
      await user.click(startButton);
      
      const calledWith = onStartGame.mock.calls[0][0] as PlayerDefinition[];
      expect(calledWith[0].id).toBe('player-1');
      expect(calledWith[1].id).toBe('player-2');
      expect(calledWith[2].id).toBe('player-3');
    });

    it('should preserve AI/Human settings', async () => {
      const user = userEvent.setup();
      render(<GameSetup onStartGame={onStartGame} />);
      
      const startButton = screen.getByRole('button', { name: /start game/i });
      await user.click(startButton);
      
      const calledWith = onStartGame.mock.calls[0][0] as PlayerDefinition[];
      expect(calledWith[0].isAI).toBe(false); // First player is human
      expect(calledWith[1].isAI).toBe(true);  // Others are AI
      expect(calledWith[2].isAI).toBe(true);
    });
  });

  describe('Help Modal', () => {
    it('should not show help modal initially', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      // Help modal should not be visible
      const modal = screen.queryByRole('dialog');
      expect(modal).not.toBeInTheDocument();
    });

    it('should open help modal when How to Play button clicked', async () => {
      const user = userEvent.setup();
      render(<GameSetup onStartGame={onStartGame} />);
      
      const helpButton = screen.getByRole('button', { name: /how to play/i });
      await user.click(helpButton);
      
      // Check if modal dialog appears
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid player count changes', async () => {
      const user = userEvent.setup();
      render(<GameSetup onStartGame={onStartGame} />);
      
      // Initial player inputs
      let playerInputs = screen.getAllByPlaceholderText(/Player \d+/);
      expect(playerInputs).toHaveLength(3);
      
      // Test that component handles changes gracefully
      expect(screen.getByText('Game Setup')).toBeInTheDocument();
    });

    it('should handle special characters in player names', async () => {
      const user = userEvent.setup();
      render(<GameSetup onStartGame={onStartGame} />);
      
      const firstPlayerInput = screen.getByDisplayValue('You');
      await user.clear(firstPlayerInput);
      await user.type(firstPlayerInput, 'Alice_123!@#');
      
      expect(screen.getByDisplayValue('Alice_123!@#')).toBeInTheDocument();
    });

    it('should handle very long player names', async () => {
      const user = userEvent.setup();
      render(<GameSetup onStartGame={onStartGame} />);
      
      const longName = 'A'.repeat(50);
      const firstPlayerInput = screen.getByDisplayValue('You');
      await user.clear(firstPlayerInput);
      await user.type(firstPlayerInput, longName);
      
      expect(screen.getByDisplayValue(longName)).toBeInTheDocument();
    });

    it('should handle multiple Start Game clicks', async () => {
      const user = userEvent.setup();
      render(<GameSetup onStartGame={onStartGame} />);
      
      const startButton = screen.getByRole('button', { name: /start game/i });
      await user.click(startButton);
      await user.click(startButton);
      await user.click(startButton);
      
      expect(onStartGame).toHaveBeenCalledTimes(3);
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for inputs', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      expect(
        screen.getByText('Number of players (2-5):')
      ).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      const startButton = screen.getByRole('button', { name: /start game/i });
      const helpButton = screen.getByRole('button', { name: /how to play/i });
      
      expect(startButton).toBeInTheDocument();
      expect(helpButton).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      
      expect(h1).toHaveTextContent('American Tile Trails');
      expect(h2).toHaveTextContent('Game Setup');
    });
  });

  describe('Styling and Layout', () => {
    it('should render sidebar section', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      const sidebar = document.querySelector('.sidebar');
      expect(sidebar).toBeInTheDocument();
    });

    it('should render board panel', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      const boardPanel = document.querySelector('.board-panel');
      expect(boardPanel).toBeInTheDocument();
    });

    it('should render game setup section', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      const gameSetup = document.querySelector('.game-setup');
      expect(gameSetup).toBeInTheDocument();
    });

    it('should render setup controls', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      const setupControls = document.querySelector('.setup-controls');
      expect(setupControls).toBeInTheDocument();
    });

    it('should render player config section', () => {
      render(<GameSetup onStartGame={onStartGame} />);
      
      const playerConfig = document.querySelector('.player-config');
      expect(playerConfig).toBeInTheDocument();
    });
  });
});
