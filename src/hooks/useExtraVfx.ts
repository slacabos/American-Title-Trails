import { useCallback, useEffect, useState } from "react";
import { readExtraVfx, saveExtraVfx } from "@/rendering/extraVfx";

const CHANGE_EVENT = "american-tile-trails:extra-vfx";

/** Extra visual effects for the whole app; every caller stays in sync. */
export function useExtraVfx() {
  const [enabled, setEnabled] = useState(readExtraVfx);

  useEffect(() => {
    const sync = (event: Event) => setEnabled((event as CustomEvent<boolean>).detail);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => window.removeEventListener(CHANGE_EVENT, sync);
  }, []);

  const toggle = useCallback(() => {
    const next = !enabled;
    saveExtraVfx(next);
    setEnabled(next);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
  }, [enabled]);

  return { extraVfx: enabled, toggle };
}

export default useExtraVfx;
