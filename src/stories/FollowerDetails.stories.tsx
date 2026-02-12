import type { Meta, StoryObj } from "@storybook/react";
import FollowerDetails from "../components/FollowerDetails";

const meta: Meta<typeof FollowerDetails> = {
  title: "Game/FollowerDetails",
  component: FollowerDetails,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen w-full bg-background p-8 flex items-center justify-center">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof FollowerDetails>;

export const AllFree: Story = {
  args: {
    breakdown: {
      total: 7,
      remaining: 7,
      placed: 0,
      byFeature: { road: 0, costco: 0, mcdonalds: 0, field: 0 },
    },
  },
};

export const Mixed: Story = {
  args: {
    breakdown: {
      total: 7,
      remaining: 3,
      placed: 4,
      byFeature: { road: 1, costco: 1, mcdonalds: 1, field: 1 },
    },
  },
};

export const AllPlaced: Story = {
  args: {
    breakdown: {
      total: 7,
      remaining: 0,
      placed: 7,
      byFeature: { road: 2, costco: 2, mcdonalds: 1, field: 2 },
    },
  },
};
