import React from "react";
import { Hamburger, Route, Store, Wheat, type LucideIcon } from "lucide-react";
import type { FollowerBreakdown } from "../utils/followerUtils";

interface FollowerDetailsProps {
  breakdown: FollowerBreakdown;
}

const FEATURE_ICONS: Record<keyof FollowerBreakdown["byFeature"], LucideIcon> = {
  road: Route,
  costco: Store,
  mcdonalds: Hamburger,
  field: Wheat,
};

const FollowerDetails: React.FC<FollowerDetailsProps> = ({ breakdown }) => {
  const placedFeatures = Object.entries(breakdown.byFeature)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => ({
      type: type as keyof FollowerBreakdown["byFeature"],
      count,
    }));

  return (
    <span className="follower-details inline-flex items-center gap-1.5">
      {breakdown.remaining} free
      {placedFeatures.map(({ type, count }) => {
        const Icon = FEATURE_ICONS[type];
        return (
          <span key={type} className="inline-flex items-center gap-0.5" title={type}>
            <Icon size={12} aria-label={type} />
            {count}
          </span>
        );
      })}
    </span>
  );
};

export default FollowerDetails;
