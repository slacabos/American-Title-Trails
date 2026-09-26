import { Sparkles } from "lucide-react";
import useTranslations from "@/hooks/useTranslations";

/** Switches optional effects such as animated water. */
export function VfxToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  const { t } = useTranslations();
  const label = t(enabled ? "hud.disableExtraVfx" : "hud.enableExtraVfx");
  return (
    <button
      type="button"
      className="hud-icon-button hud-vfx-toggle"
      aria-label={label}
      title={`${label} (G)`}
      aria-pressed={enabled}
      onClick={onToggle}
    >
      <Sparkles size={18} aria-hidden="true" />
    </button>
  );
}

export default VfxToggle;
