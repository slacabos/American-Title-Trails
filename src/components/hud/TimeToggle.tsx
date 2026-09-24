import { Moon, Sun } from "lucide-react";
import useTranslations from "@/hooks/useTranslations";

/** Sun/moon switch shared by the setup screen and the game HUD. */
export function TimeToggle({ night, onToggle }: { night: boolean; onToggle: () => void }) {
  const { t } = useTranslations();
  const label = t(night ? "hud.switchToDay" : "hud.switchToNight");
  return (
    <button
      type="button"
      className="hud-icon-button"
      aria-label={label}
      title={`${label} (N)`}
      aria-pressed={night}
      onClick={onToggle}
    >
      {night ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}

export default TimeToggle;
