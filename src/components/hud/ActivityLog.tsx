import { useState } from "react";
import { ChevronDown, ChevronUp, ScrollText } from "lucide-react";
import useTranslations from "@/hooks/useTranslations";

export interface LogEntry {
  id: number;
  time: string;
  message: string;
}

/** Collapsed it shows the newest entry; expanded it lists recent activity. */
export function ActivityLog({ entries, className }: { entries: LogEntry[]; className?: string }) {
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);
  const latest = entries[0];
  return (
    <section className={`hud-panel activity-log ${className ?? ""}`} data-open={open}>
      {open && (
        <ul aria-label={t("hud.activity")}>
          {entries.length === 0 && <li>{t("hud.noActivity")}</li>}
          {entries.map((entry) => (
            <li key={entry.id}>
              <time>{entry.time}</time>
              {entry.message}
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="activity-log-toggle"
        aria-expanded={open}
        aria-label={t(open ? "hud.hideActivity" : "hud.showActivity")}
        onClick={() => setOpen((value) => !value)}
      >
        <ScrollText size={16} aria-hidden="true" className="shrink-0 text-moss" />
        <span className="activity-log-latest" aria-live="polite">
          {open ? t("hud.activity") : latest?.message ?? t("hud.noActivity")}
        </span>
        {open ? (
          <ChevronDown size={16} aria-hidden="true" className="shrink-0" />
        ) : (
          <ChevronUp size={16} aria-hidden="true" className="shrink-0" />
        )}
      </button>
    </section>
  );
}

export default ActivityLog;
