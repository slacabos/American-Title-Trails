import React from "react";
import type { FollowerBreakdown } from "../utils/followerUtils";

interface FollowerDetailsProps {
  breakdown: FollowerBreakdown;
}

const FEATURE_ICONS: Record<keyof FollowerBreakdown["byFeature"], string> = {
  road: "🛣️",
  costco: "🏪",
  mcdonalds: "🍔",
  field: "🌾",
};

const FollowerDetails: React.FC<FollowerDetailsProps> = ({ breakdown }) => {
  const placedFeatures = Object.entries(breakdown.byFeature)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({
      type: type as keyof FollowerBreakdown["byFeature"],
      count,
    }));

  return (
    <span className="text-xs opacity-80 font-game">
      {breakdown.remaining} free
      {placedFeatures.length > 0 && (
        <>
          {" ("}
          {placedFeatures.map(({ type, count }, index) => (
            <span key={type}>
              {FEATURE_ICONS[type]}
              {count}
              {index < placedFeatures.length - 1 && " "}
            </span>
          ))}
          {")"}
        </>
      )}
    </span>
  );
};

export default FollowerDetails;
