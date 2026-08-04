import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTimer } from "./useTimer";

vi.mock("../lib/alarm", () => ({
  playAlarm: vi.fn(),
  unlockAudioContext: vi.fn(),
}));
import { playAlarm } from "../lib/alarm";

const settings = {
  workDurationMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  focusEndSound: "beep",
  breakEndSound: "chime",
  alarmVolume: 0.6,
};

// Short durations (in seconds, via fractional minutes) so full-cycle tests
// don't need to advance fake timers for a full 25 minutes.
const fastSettings = {
  ...settings,
  workDurationMin: 3 / 60,
  shortBreakMin: 2 / 60,
  longBreakMin: 4 / 60,
};

beforeEach(() => {
  vi.useFakeTimers();
  playAlarm.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useTimer", () => {
  it("starts idle on work mode with the full duration and no dots painted", () => {
    const { result } = renderHook(() => useTimer(settings));
    expect(result.current.mode).toBe("work");
    expect(result.current.formatted).toBe("25:00");
    expect(result.current.isRunning).toBe(false);
    expect(result.current.cycleIndex).toBe(0);
  });

  it("paints the first dot immediately when Iniciar is pressed", () => {
    const { result } = renderHook(() => useTimer(settings));
    act(() => result.current.start());
    expect(result.current.isRunning).toBe(true);
    expect(result.current.cycleIndex).toBe(1);
  });

  it("resuming from a pause does not paint another dot", () => {
    const { result } = renderHook(() => useTimer(settings));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(2000));
    act(() => result.current.pause());
    expect(result.current.cycleIndex).toBe(1);

    act(() => result.current.start()); // resume, mid-session
    expect(result.current.cycleIndex).toBe(1);
    expect(result.current.isRunning).toBe(true);
  });

  it("counts down one second per tick once started", () => {
    const { result } = renderHook(() => useTimer(settings));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.secondsLeft).toBe(25 * 60 - 1);
  });

  it("reset stops the timer and restores the full duration without touching dots", () => {
    const { result } = renderHook(() => useTimer(settings));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(5000));
    act(() => result.current.reset());
    expect(result.current.isRunning).toBe(false);
    expect(result.current.secondsLeft).toBe(25 * 60);
    expect(result.current.cycleIndex).toBe(1);
  });

  it("auto-pauses and switches to a short break when a focus session finishes, playing the focus alarm", () => {
    const { result } = renderHook(() => useTimer(fastSettings));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000)); // work duration in fastSettings

    expect(result.current.mode).toBe("short");
    expect(result.current.isRunning).toBe(false); // per spec: waits for the user
    expect(result.current.cycleIndex).toBe(1); // dot stays painted through the break
    expect(playAlarm).toHaveBeenCalledTimes(1);
    expect(playAlarm).toHaveBeenCalledWith(fastSettings.focusEndSound, fastSettings.alarmVolume);
  });

  it("requires pressing Iniciar again to start the break (does not auto-run)", () => {
    const { result } = renderHook(() => useTimer(fastSettings));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000));
    act(() => vi.advanceTimersByTime(5000)); // would finish the break if it were running
    expect(result.current.mode).toBe("short");
    expect(result.current.isRunning).toBe(false);
    expect(result.current.secondsLeft).toBe(2); // untouched, break duration in fastSettings
  });

  it("starting the break does not paint an extra dot, and finishing it plays the break alarm", () => {
    const { result } = renderHook(() => useTimer(fastSettings));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000)); // -> short break, paused
    playAlarm.mockClear();

    act(() => result.current.start()); // user presses Iniciar for the break
    expect(result.current.cycleIndex).toBe(1);
    act(() => vi.advanceTimersByTime(2000)); // finishes the short break

    expect(result.current.mode).toBe("work");
    expect(result.current.isRunning).toBe(false);
    expect(result.current.cycleIndex).toBe(1); // not reset after a short break
    expect(playAlarm).toHaveBeenCalledWith(fastSettings.breakEndSound, fastSettings.alarmVolume);
  });

  it("takes a long break on the 4th cycle and resets the dots once it finishes", () => {
    const { result } = renderHook(() => useTimer(fastSettings));

    for (let cycle = 1; cycle <= 3; cycle += 1) {
      act(() => result.current.start()); // work
      act(() => vi.advanceTimersByTime(3000));
      expect(result.current.mode).toBe("short");
      expect(result.current.cycleIndex).toBe(cycle);

      act(() => result.current.start()); // short break
      act(() => vi.advanceTimersByTime(2000));
    }

    // 4th work session
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.mode).toBe("long");
    expect(result.current.cycleIndex).toBe(4);

    act(() => result.current.start()); // long break
    act(() => vi.advanceTimersByTime(4000));

    expect(result.current.mode).toBe("work");
    expect(result.current.cycleIndex).toBe(0); // dots reset after the long break
  });

  it("skip silently forces the same transition without playing a sound", () => {
    const { result } = renderHook(() => useTimer(fastSettings));
    act(() => result.current.start());
    act(() => result.current.skip());
    expect(result.current.mode).toBe("short");
    expect(result.current.isRunning).toBe(false);
    expect(playAlarm).not.toHaveBeenCalled();
  });
});
