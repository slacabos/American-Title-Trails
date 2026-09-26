// Every sound is synthesized with the Web Audio API; there are no audio files.

export type Cue =
  | "land"
  | "rotate"
  | "claim"
  | "complete"
  | "completeCostco"
  | "yourTurn"
  | "invalid"
  | "gameOver";

interface Audio {
  context: AudioContext;
  master: GainNode;
  noise: AudioBuffer;
}

let audio: Audio | undefined;

type AudioContextClass = typeof AudioContext;
const audioContextClass = (): AudioContextClass | undefined =>
  typeof window === "undefined"
    ? undefined
    : window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextClass }).webkitAudioContext;

/**
 * Starts audio. Browsers only allow it after a user gesture, so this runs
 * from one; until then every cue is silently dropped.
 */
export function unlockAudio(): void {
  const AudioContextClass = audioContextClass();
  if (!AudioContextClass) return;
  try {
    if (!audio) {
      const context = new AudioContextClass();
      const master = context.createGain();
      master.gain.value = 0.5;
      master.connect(context.destination);
      audio = { context, master, noise: noiseBuffer(context) };
    }
    if (audio.context.state === "suspended") void audio.context.resume();
  } catch {
    /* Sound is optional. */
  }
}

/** Plays a cue now, if audio has started. */
export function playCue(cue: Cue): void {
  if (!audio || audio.context.state !== "running") return;
  try {
    CUES[cue](audio, audio.context.currentTime);
  } catch {
    /* Sound is optional. */
  }
}

/** Forgets the audio context; for tests. */
export function resetAudio(): void {
  void audio?.context.close?.();
  audio = undefined;
}

function noiseBuffer(context: AudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.2), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

interface Tone {
  type?: OscillatorType;
  freq: number;
  /** Glide to this frequency over the tone. */
  to?: number;
  at?: number;
  duration: number;
  gain: number;
  attack?: number;
}

/** One oscillator with a quick attack and an exponential decay. */
function tone({ context, master }: Audio, start: number, { type = "sine", freq, to, at = 0, duration, gain, attack = 0.005 }: Tone) {
  const t0 = start + at;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, t0);
  if (to) oscillator.frequency.exponentialRampToValueAtTime(to, t0 + duration);
  envelope.gain.setValueAtTime(0.0001, t0);
  envelope.gain.linearRampToValueAtTime(gain, t0 + attack);
  envelope.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  oscillator.connect(envelope).connect(master);
  oscillator.start(t0);
  oscillator.stop(t0 + duration + 0.02);
}

/** A burst of low-passed noise: the knock of wood on wood. */
function knock({ context, master, noise }: Audio, start: number, { duration, gain, cutoff }: { duration: number; gain: number; cutoff: number }) {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const envelope = context.createGain();
  source.buffer = noise;
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  envelope.gain.setValueAtTime(gain, start);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter).connect(envelope).connect(master);
  source.start(start);
  source.stop(start + duration + 0.02);
}

/** Notes in sequence, each ringing a little past the next. */
function arpeggio(audio: Audio, start: number, notes: number[], step: number, gain: number, ring = 0.3) {
  notes.forEach((freq, index) => {
    const last = index === notes.length - 1;
    tone(audio, start, { type: "triangle", freq, at: index * step, duration: last ? ring * 2 : ring, gain });
  });
}

const CUES: Record<Cue, (audio: Audio, start: number) => void> = {
  land: (audio, start) => {
    tone(audio, start, { freq: 140, to: 55, duration: 0.18, gain: 0.9 });
    knock(audio, start, { duration: 0.08, gain: 0.5, cutoff: 900 });
  },
  rotate: (audio, start) => tone(audio, start, { type: "triangle", freq: 1400, to: 1100, duration: 0.04, gain: 0.15 }),
  claim: (audio, start) => {
    tone(audio, start, { freq: 300, to: 900, duration: 0.07, gain: 0.4 });
    knock(audio, start, { duration: 0.03, gain: 0.25, cutoff: 2000 });
  },
  // G5 → C6, and E5 → G5 → C6 for a Costco.
  complete: (audio, start) => arpeggio(audio, start, [784, 1047], 0.12, 0.22),
  completeCostco: (audio, start) => arpeggio(audio, start, [659, 784, 1047], 0.1, 0.22),
  yourTurn: (audio, start) => tone(audio, start, { freq: 880, duration: 0.4, gain: 0.16, attack: 0.02 }),
  invalid: (audio, start) => tone(audio, start, { type: "triangle", freq: 150, to: 110, duration: 0.15, gain: 0.25 }),
  // C5 E5 G5 C6.
  gameOver: (audio, start) => arpeggio(audio, start, [523, 659, 784, 1047], 0.14, 0.24, 0.35),
};
