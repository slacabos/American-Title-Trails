import { useEffect, useRef } from "react";
import type { GameState } from "@/types";
import { soundCues, soundSnapshot, type SoundSnapshot } from "@/audio/cues";
import type { Cue } from "@/audio/soundEngine";
import { LANDING_IMPACT_MS, prefersReducedMotion } from "@/rendering/landingTiming";

/** Plays the sounds for each game state change, timed to the landing tile. */
export function useGameSounds(state: GameState, play: (cue: Cue) => void) {
  const previous = useRef<SoundSnapshot | undefined>(undefined);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const next = soundSnapshot(state);
    const impact = prefersReducedMotion() ? 0 : LANDING_IMPACT_MS;
    for (const { cue, at } of soundCues(previous.current, next, impact)) {
      if (at <= 0) {
        play(cue);
        continue;
      }
      const timer = setTimeout(() => {
        timers.current.delete(timer);
        play(cue);
      }, at);
      timers.current.add(timer);
    }
    previous.current = next;
  }, [state, play]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);
}

export default useGameSounds;
