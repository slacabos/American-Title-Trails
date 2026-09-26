import { afterEach, describe, expect, it, vi } from "vitest";
import { readSoundEnabled, saveSoundEnabled } from "@/audio/soundPreference";
import { playCue, resetAudio, unlockAudio, type Cue } from "@/audio/soundEngine";

const param = () => ({
  value: 0,
  setValueAtTime: vi.fn(),
  linearRampToValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(),
});
const node = () => ({ connect: vi.fn((target: unknown) => target) });

/** Just enough of an AudioContext to build every cue's node graph. */
class FakeAudioContext {
  static started: string[] = [];
  state = "suspended";
  currentTime = 1;
  sampleRate = 8000;
  destination = {};
  resume = vi.fn(async () => {
    this.state = "running";
  });
  close = vi.fn(async () => undefined);
  createGain = () => ({ ...node(), gain: param() });
  createBiquadFilter = () => ({ ...node(), type: "", frequency: param() });
  createBuffer = (_channels: number, length: number) => ({ getChannelData: () => new Float32Array(length) });
  createOscillator = () => ({
    ...node(),
    type: "",
    frequency: param(),
    start: vi.fn(() => FakeAudioContext.started.push("oscillator")),
    stop: vi.fn(),
  });
  createBufferSource = () => ({
    ...node(),
    buffer: null,
    start: vi.fn(() => FakeAudioContext.started.push("noise")),
    stop: vi.fn(),
  });
}

afterEach(() => {
  resetAudio();
  localStorage.clear();
  vi.unstubAllGlobals();
  FakeAudioContext.started = [];
});

describe("sound preference", () => {
  it("is on until turned off, and remembers the choice", () => {
    expect(readSoundEnabled()).toBe(true);
    saveSoundEnabled(false);
    expect(readSoundEnabled()).toBe(false);
    saveSoundEnabled(true);
    expect(readSoundEnabled()).toBe(true);
  });
});

describe("sound engine", () => {
  it("does nothing without Web Audio", () => {
    vi.stubGlobal("AudioContext", undefined);
    expect(() => {
      unlockAudio();
      playCue("land");
    }).not.toThrow();
  });

  it("stays silent until a gesture starts audio, then plays every cue", async () => {
    vi.stubGlobal("AudioContext", FakeAudioContext);
    playCue("land");
    expect(FakeAudioContext.started).toEqual([]);

    unlockAudio();
    await Promise.resolve();
    const cues: Cue[] = ["land", "rotate", "claim", "complete", "completeCostco", "yourTurn", "invalid", "gameOver"];
    for (const cue of cues) {
      const before = FakeAudioContext.started.length;
      playCue(cue);
      expect(FakeAudioContext.started.length, cue).toBeGreaterThan(before);
    }
    expect(FakeAudioContext.started).toContain("noise");
  });
});
