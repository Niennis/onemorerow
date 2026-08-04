import { describe, expect, it } from "vitest";
import { ALARM_SOUNDS, playAlarm, unlockAudioContext } from "./alarm";

describe("ALARM_SOUNDS", () => {
  it("always includes a 'none' option to make the alarm optional", () => {
    expect(ALARM_SOUNDS.some((s) => s.id === "none")).toBe(true);
  });

  it("every entry has an id and a label", () => {
    for (const sound of ALARM_SOUNDS) {
      expect(typeof sound.id).toBe("string");
      expect(typeof sound.label).toBe("string");
    }
  });
});

// jsdom has no Web Audio API, which is exactly the "unsupported" branch
// these helpers need to fail silently on instead of throwing.
describe("playAlarm / unlockAudioContext without Web Audio support", () => {
  it("does nothing for 'none'", () => {
    expect(() => playAlarm("none", 0.6)).not.toThrow();
  });

  it("does nothing for an unknown id", () => {
    expect(() => playAlarm("not-a-real-sound", 0.6)).not.toThrow();
  });

  it("does nothing for a real sound id when Web Audio is unavailable", () => {
    expect(() => playAlarm("beep", 0.6)).not.toThrow();
  });

  it("unlockAudioContext does not throw", () => {
    expect(() => unlockAudioContext()).not.toThrow();
  });
});
