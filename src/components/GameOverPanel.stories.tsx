import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";
import GameOverPanel from "./GameOverPanel";
import type { PlayerState, ScoreBreakdown } from "../types";

const players: PlayerState[] = [
  {
    id: "p1",
    name: "Alex",
    isAI: false,
    score: 62,
    followers: 3,
    color: "#f97316",
  },
  {
    id: "p2",
    name: "River",
    isAI: true,
    aiDifficulty: "hard",
    score: 54,
    followers: 2,
    color: "#38bdf8",
  },
  {
    id: "p3",
    name: "Morgan",
    isAI: false,
    score: 41,
    followers: 1,
    color: "#facc15",
  },
];

const scoreBreakdown: ScoreBreakdown = {
  p1: {
    completed_road: 14,
    completed_costco: 22,
    completed_mcdonalds: 9,
    incomplete_costco: 8,
    incomplete_road: 3,
    incomplete_mcdonalds: 0,
    farmers: 6,
  },
  p2: {
    completed_road: 8,
    completed_costco: 18,
    completed_mcdonalds: 0,
    incomplete_costco: 7,
    incomplete_road: 2,
    incomplete_mcdonalds: 4,
    farmers: 15,
  },
  p3: {
    completed_road: 6,
    completed_costco: 10,
    completed_mcdonalds: 0,
    incomplete_costco: 5,
    incomplete_road: 4,
    incomplete_mcdonalds: 0,
    farmers: 16,
  },
};

const meta: Meta<typeof GameOverPanel> = {
  title: "Game/GameOverPanel",
  component: GameOverPanel,
  decorators: [
    (Story) => (
      <div className="w-full max-w-xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof GameOverPanel>;

const renderInteractive: Story["render"] = (args) => {
  const [collapsed, setCollapsed] = useState(args.collapsed ?? false);

  useEffect(() => {
    setCollapsed(args.collapsed ?? false);
  }, [args.collapsed]);

  return (
    <GameOverPanel
      {...args}
      collapsed={collapsed}
      onToggle={() => setCollapsed((prev) => !prev)}
    />
  );
};

export const Default: Story = {
  args: {
    players,
    winner: "Alex",
    scoreBreakdown,
    onReset: () => undefined,
    collapsed: false,
    onToggle: () => undefined,
  },
  render: renderInteractive,
};

export const Collapsed: Story = {
  args: {
    players,
    winner: "Alex",
    scoreBreakdown,
    onReset: () => undefined,
    collapsed: true,
    onToggle: () => undefined,
  },
  render: renderInteractive,
};
