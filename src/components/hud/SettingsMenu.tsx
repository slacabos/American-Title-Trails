import type { LucideIcon } from "lucide-react";
import { Moon, Settings, Sparkles, Volume2 } from "lucide-react";
import useTranslations from "@/hooks/useTranslations";

interface SettingsMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  night: boolean;
  onToggleNight: () => void;
  sound: boolean;
  onToggleSound: () => void;
  extraVfx: boolean;
  onToggleVfx: () => void;
}

/** One gear button for the in-game switches, so the HUD keeps few icons. */
export function SettingsMenu({
  open,
  onOpenChange,
  night,
  onToggleNight,
  sound,
  onToggleSound,
  extraVfx,
  onToggleVfx,
}: SettingsMenuProps) {
  const { t } = useTranslations();
  const settings: { label: string; icon: LucideIcon; shortcut: string; on: boolean; toggle: () => void }[] = [
    { label: t("hud.nightMode"), icon: Moon, shortcut: "N", on: night, toggle: onToggleNight },
    { label: t("hud.sound"), icon: Volume2, shortcut: "M", on: sound, toggle: onToggleSound },
    { label: t("hud.extraVfx"), icon: Sparkles, shortcut: "G", on: extraVfx, toggle: onToggleVfx },
  ];
  return (
    <div className="hud-menu hud-settings">
      <button
        type="button"
        className="hud-icon-button"
        aria-label={t("hud.settings")}
        title={t("hud.settings")}
        aria-expanded={open}
        aria-controls="hud-settings-panel"
        onClick={() => onOpenChange(!open)}
      >
        <Settings size={18} aria-hidden="true" />
      </button>
      {open && (
        <div
          id="hud-settings-panel"
          className="hud-panel hud-menu-list hud-settings-panel"
          role="group"
          aria-label={t("hud.settings")}
        >
          <div className="hud-panel-title">{t("hud.settings")}</div>
          {settings.map(({ label, icon: Icon, shortcut, on, toggle }) => (
            <button
              key={shortcut}
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={label}
              aria-keyshortcuts={shortcut}
              onClick={toggle}
            >
              <Icon size={15} aria-hidden="true" />
              <span className="hud-setting-label">{label}</span>
              <kbd>{shortcut}</kbd>
              <span className="hud-switch" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default SettingsMenu;
