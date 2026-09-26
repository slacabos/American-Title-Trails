import { useCallback, useEffect, useState } from "react";
import { readSoundEnabled, saveSoundEnabled } from "@/audio/soundPreference";
import { playCue, unlockAudio, type Cue } from "@/audio/soundEngine";

const CHANGE_EVENT = "american-tile-trails:sound";

/** Sound on or off for the whole app, and a `play` that respects it. */
export function useSound() {
  const [enabled, setEnabled] = useState(readSoundEnabled);

  useEffect(() => {
    const sync = (event: Event) => setEnabled((event as CustomEvent<boolean>).detail);
    window.addEventListener(CHANGE_EVENT, sync);
    return () => window.removeEventListener(CHANGE_EVENT, sync);
  }, []);

  // Browsers start audio only from a user gesture.
  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  const toggle = useCallback(() => {
    const next = !enabled;
    saveSoundEnabled(next);
    setEnabled(next);
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
  }, [enabled]);

  const play = useCallback(
    (cue: Cue) => {
      if (enabled) playCue(cue);
    },
    [enabled],
  );

  return { enabled, toggle, play };
}

export default useSound;
