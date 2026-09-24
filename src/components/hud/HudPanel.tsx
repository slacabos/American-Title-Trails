import React from "react";
import { cn } from "@/lib/utils";

interface HudPanelProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  title?: React.ReactNode;
  action?: React.ReactNode;
}

/** Floating parchment card shared by every panel drawn over the board. */
export const HudPanel = React.forwardRef<HTMLElement, HudPanelProps>(function HudPanel(
  { title, action, className, children, ...props },
  ref,
) {
  return (
    <section ref={ref} className={cn("hud-panel", className)} {...props}>
      {(title || action) && (
        <div className="hud-panel-title">
          {title && <h2 className="m-0 text-inherit">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
});

export default HudPanel;
