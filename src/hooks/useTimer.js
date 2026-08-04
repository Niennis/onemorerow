import { useEffect, useMemo, useReducer, useRef } from "react";
import { playAlarm, unlockAudioContext } from "../lib/alarm";

const SESSIONS_BEFORE_LONG_BREAK = 4;

const MODE_LABELS = {
  work: "Enfoque",
  short: "Descanso corto",
  long: "Descanso largo",
};

function durationFor(mode, settings) {
  if (mode === "work") return settings.workDurationMin * 60;
  if (mode === "short") return settings.shortBreakMin * 60;
  return settings.longBreakMin * 60;
}

function initState(settings) {
  return {
    mode: "work",
    secondsLeft: durationFor("work", settings),
    isRunning: false,
    cycleIndex: 0, // how many dots are currently painted (0..4)
    workStarted: false, // has the CURRENT work phase already painted its dot?
    pendingAlarm: null, // "focus" | "break" | null — consumed by the alarm effect
    transitionId: 0, // bumped on every phase change, so the alarm effect can react
  };
}

// Shared by a natural 0:00 timeout and a manual Skip: moves to the next
// phase and always auto-pauses (per spec, the user presses Iniciar again).
function completePhase(state, settings) {
  if (state.mode === "work") {
    const nextMode = state.cycleIndex >= SESSIONS_BEFORE_LONG_BREAK ? "long" : "short";
    return {
      mode: nextMode,
      secondsLeft: durationFor(nextMode, settings),
      isRunning: false,
      cycleIndex: state.cycleIndex,
      workStarted: false,
    };
  }

  const justFinishedLongBreak = state.mode === "long";
  return {
    mode: "work",
    secondsLeft: durationFor("work", settings),
    isRunning: false,
    cycleIndex: justFinishedLongBreak ? 0 : state.cycleIndex,
    workStarted: false,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "START": {
      if (state.isRunning) return state;
      // Starting a work phase for the first time (not resuming from pause)
      // is what paints this cycle's dot.
      if (state.mode === "work" && !state.workStarted) {
        return { ...state, isRunning: true, cycleIndex: state.cycleIndex + 1, workStarted: true };
      }
      return { ...state, isRunning: true };
    }
    case "PAUSE":
      return { ...state, isRunning: false };
    case "RESET":
      return { ...state, isRunning: false, secondsLeft: durationFor(state.mode, action.settings) };
    case "TICK": {
      if (!state.isRunning) return state;
      if (state.secondsLeft > 1) return { ...state, secondsLeft: state.secondsLeft - 1 };
      const finishedMode = state.mode;
      return {
        ...completePhase(state, action.settings),
        pendingAlarm: finishedMode === "work" ? "focus" : "break",
        transitionId: state.transitionId + 1,
      };
    }
    case "SKIP":
      return {
        ...completePhase(state, action.settings),
        pendingAlarm: null, // a manual skip doesn't need a notification sound
        transitionId: state.transitionId + 1,
      };
    case "SYNC_DURATION":
      if (state.isRunning) return state;
      return { ...state, secondsLeft: durationFor(state.mode, action.settings) };
    default:
      return state;
  }
}

export function useTimer(settings) {
  const [state, dispatch] = useReducer(reducer, settings, initState);
  const settingsRef = useRef(settings);
  const playedTransitionRef = useRef(0);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // Countdown: ticks once a second while running. Reads settings via the ref
  // so this effect only needs to restart when isRunning itself changes.
  useEffect(() => {
    if (!state.isRunning) return undefined;
    const id = setInterval(() => dispatch({ type: "TICK", settings: settingsRef.current }), 1000);
    return () => clearInterval(id);
  }, [state.isRunning]);

  // Keep the countdown in sync with duration edits while idle.
  useEffect(() => {
    dispatch({ type: "SYNC_DURATION", settings });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.workDurationMin, settings.shortBreakMin, settings.longBreakMin, state.mode]);

  // Plays the alarm exactly once per real transition. The ref guard is what
  // keeps this safe under React StrictMode's dev-only double effect firing.
  useEffect(() => {
    if (playedTransitionRef.current === state.transitionId) return;
    playedTransitionRef.current = state.transitionId;
    if (state.pendingAlarm === "focus") {
      playAlarm(settingsRef.current.focusEndSound, settingsRef.current.alarmVolume);
    } else if (state.pendingAlarm === "break") {
      playAlarm(settingsRef.current.breakEndSound, settingsRef.current.alarmVolume);
    }
    // pendingAlarm always changes together with transitionId, so keying off
    // transitionId alone is enough and avoids re-running for unrelated state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.transitionId]);

  const start = () => {
    unlockAudioContext(); // must run inside this user-gesture handler
    dispatch({ type: "START" });
  };
  const pause = () => dispatch({ type: "PAUSE" });
  const reset = () => dispatch({ type: "RESET", settings });
  const skip = () => dispatch({ type: "SKIP", settings });

  const formatted = useMemo(() => {
    const m = Math.floor(state.secondsLeft / 60)
      .toString()
      .padStart(2, "0");
    const s = (state.secondsLeft % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [state.secondsLeft]);

  const progress = 1 - state.secondsLeft / durationFor(state.mode, settings);

  return {
    mode: state.mode,
    modeLabel: MODE_LABELS[state.mode],
    secondsLeft: state.secondsLeft,
    formatted,
    progress,
    isRunning: state.isRunning,
    start,
    pause,
    reset,
    skip,
    cycleIndex: state.cycleIndex,
  };
}
