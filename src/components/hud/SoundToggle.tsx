import { Volume2, VolumeX } from "lucide-react";
import useTranslations from "@/hooks/useTranslations";

/** Speaker switch for the game HUD. */
export function SoundToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  const { t } = useTranslations();
  const label = t(enabled ? "hud.muteSound" : "hud.unmuteSound");
  return (
    <button
      type="button"
      className="hud-icon-button"
      aria-label={label}
      title={`${label} (M)`}
      aria-pressed={!enabled}
      onClick={onToggle}
    >
      {enabled ? <Volume2 size={18} aria-hidden="true" /> : <VolumeX size={18} aria-hidden="true" />}
    </button>
  );
}

export default SoundToggle;
