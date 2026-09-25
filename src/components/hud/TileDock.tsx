import React from "react";
import { RotateCcw, RotateCw } from "lucide-react";
import type { ClaimableFeature, GameState, TerrainType } from "@/types";
import { GamePhase } from "@/types";
import { Button } from "@/components/ui/button";
import useTranslations from "@/hooks/useTranslations";
import { CurrentTilePreview } from "../BoardView";
import HudPanel from "./HudPanel";

interface TileDockProps {
  state: GameState;
  claimableFeatures: ClaimableFeature[];
  onRotateClockwise: () => void;
  onRotateCounterClockwise: () => void;
  onClaim: (type: TerrainType, identifier?: string) => void;
  onSkip: () => void;
  onHighlight: (feature?: ClaimableFeature) => void;
  /** The option Enter would claim, chosen with the arrow keys or the pointer. */
  highlighted?: ClaimableFeature;
  night?: boolean;
}

/** The current tile and whatever the active player can do with it. */
export const TileDock = React.forwardRef<HTMLElement, TileDockProps>(function TileDock(
  {
    state,
    claimableFeatures,
    onRotateClockwise,
    onRotateCounterClockwise,
    onClaim,
    onSkip,
    onHighlight,
    highlighted,
    night = false,
  },
  ref,
) {
  const { t } = useTranslations();
  const player = state.players[state.currentPlayerIndex];
  const isAI = player?.isAI ?? false;
  const placing = state.phase === GamePhase.PLACE_TILE && !isAI && !!state.currentTile;
  const claiming = state.phase === GamePhase.CLAIM_FEATURE && !isAI;

  return (
    <HudPanel
      ref={ref}
      className="tile-dock"
      title={claiming ? t("hud.claimTitle") : t("hud.yourTile")}
      hidden={state.isGameOver}
      aria-label={t("hud.yourTile")}
    >
      {/* The preview stays mounted through the claim phase; recreating WebGL
          contexts every turn can exhaust the device's graphics resources. */}
      <div className="tile-dock-preview" hidden={!state.currentTile}>
        <CurrentTilePreview tile={state.currentTile} night={night} />
      </div>
      <div className="tile-dock-body">
        {state.currentTile && <div className="tile-dock-name">{state.currentTile.name}</div>}

        {placing && (
          <>
            <div className="tile-dock-rotate">
              <Button
                variant="secondary"
                onClick={onRotateCounterClockwise}
                title={t("hud.rotateCcw")}
                aria-label={t("hud.rotateCcw")}
              >
                <RotateCcw aria-hidden="true" />
              </Button>
              <Button
                variant="secondary"
                onClick={onRotateClockwise}
                title={t("hud.rotateCw")}
                aria-label={t("hud.rotateCw")}
              >
                <RotateCw aria-hidden="true" />
              </Button>
            </div>
            <p className="tile-dock-hint m-0">
              {t("hud.placeHint3d")}
            </p>
            <p className="tile-dock-hint tile-dock-keys m-0">{t("hud.keyboardHint")}</p>
          </>
        )}

        {claiming && (
          <>
            <p className="tile-dock-hint m-0">
              {t("hud.claimHint", { count: player?.followers ?? 0 })}
            </p>
            <div className="tile-dock-claims">
              {claimableFeatures.map((feature) => (
                <Button
                  key={`${feature.type}-${feature.identifier ?? ""}`}
                  variant="secondary"
                  className="justify-start aria-[current=true]:ring-2 aria-[current=true]:ring-gold"
                  aria-current={
                    highlighted?.type === feature.type && highlighted.identifier === feature.identifier
                  }
                  onMouseEnter={() => onHighlight(feature)}
                  onMouseLeave={() => onHighlight(undefined)}
                  onFocus={() => onHighlight(feature)}
                  onBlur={() => onHighlight(undefined)}
                  onClick={() => onClaim(feature.type, feature.identifier)}
                >
                  <span className="truncate">
                    {feature.type === "field"
                      ? t("hud.placeFarmer")
                      : t("hud.claim", { type: t(`hud.featureTypes.${feature.type}`) })}
                    {feature.displayName && ` (${feature.displayName})`}
                  </span>
                </Button>
              ))}
              <Button variant="outline" onClick={onSkip}>
                {t("hud.skip")}
              </Button>
            </div>
          </>
        )}

        {isAI && !state.isGameOver && (
          <p className="tile-dock-hint m-0">{t("hud.waitingFor", { name: player?.name })}</p>
        )}
      </div>
    </HudPanel>
  );
});

export default TileDock;
