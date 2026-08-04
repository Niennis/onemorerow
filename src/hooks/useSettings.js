import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const STORAGE_KEY = "onemorerow-settings";
const LEGACY_STORAGE_KEY = "pomodoro-settings"; // renamed when the app became "Una vuelta más"

export const DEFAULT_SETTINGS = {
  workDurationMin: 25,
  shortBreakMin: 5,
  longBreakMin: 15,
  theme: "default",
  backgroundType: "color",
  backgroundValue: "#1e1e2e",
  textTone: "auto", // "auto" | "light" | "dark"
  focusEndSound: "beep", // id from ALARM_SOUNDS, or "none"
  breakEndSound: "chime",
  alarmVolume: 0.6, // 0..1
  playerUrl: "", // pasted Spotify/YouTube link
};

function readLocalSettings() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);

    // One-time migration from the old key so settings saved before the
    // app was renamed to "Una vuelta más" aren't silently lost.
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        localStorage.setItem(STORAGE_KEY, legacy);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        raw = legacy;
      }
    }

    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function writeLocalSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function fromDbRow(row) {
  return {
    workDurationMin: row.work_duration_min,
    shortBreakMin: row.short_break_min,
    longBreakMin: row.long_break_min,
    theme: row.theme,
    backgroundType: row.background_type,
    backgroundValue: row.background_value,
    textTone: row.text_tone ?? "auto",
    focusEndSound: row.focus_end_sound ?? "beep",
    breakEndSound: row.break_end_sound ?? "chime",
    alarmVolume: row.alarm_volume ?? 0.6,
    playerUrl: row.player_url ?? "",
  };
}

function toDbRow(userId, settings) {
  return {
    user_id: userId,
    work_duration_min: settings.workDurationMin,
    short_break_min: settings.shortBreakMin,
    long_break_min: settings.longBreakMin,
    theme: settings.theme,
    background_type: settings.backgroundType,
    background_value: settings.backgroundValue,
    text_tone: settings.textTone,
    focus_end_sound: settings.focusEndSound,
    break_end_sound: settings.breakEndSound,
    alarm_volume: settings.alarmVolume,
    player_url: settings.playerUrl,
  };
}

function isDefaultSettings(candidate) {
  return JSON.stringify(candidate) === JSON.stringify(DEFAULT_SETTINGS);
}

// Local-only when logged out; synced to Supabase (per user_id) when logged in.
export function useSettings(user) {
  const [settings, setSettings] = useState(readLocalSettings);
  const [loading, setLoading] = useState(false);
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    if (!user) {
      setSettings(readLocalSettings());
      setSyncError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (cancelled) return;

        if (error) {
          console.error("[useSettings] failed to load settings from Supabase:", error);
          setSyncError(error.message);
          setLoading(false);
          return;
        }
        if (!data) {
          setLoading(false);
          return;
        }

        const remote = fromDbRow(data);
        const local = readLocalSettings();

        // The account's settings are still untouched (fresh signup) and the
        // browser has a customized local/guest config: adopt it into the
        // account instead of showing the untouched defaults. On every later
        // login the remote row will no longer match defaults, so this only
        // ever kicks in once per account.
        if (isDefaultSettings(remote) && !isDefaultSettings(local)) {
          const { error: upsertError } = await supabase
            .from("user_settings")
            .upsert(toDbRow(user.id, local));
          if (upsertError) {
            console.error("[useSettings] failed to migrate local settings:", upsertError);
            if (!cancelled) setSyncError(upsertError.message);
          } else if (!cancelled) {
            setSettings(local);
          }
        } else if (!cancelled) {
          setSettings(remote);
        }

        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const updateSettings = useCallback(
    async (partial) => {
      const next = { ...settings, ...partial };
      setSettings(next);

      if (!user) {
        writeLocalSettings(next);
        return;
      }

      const { error } = await supabase.from("user_settings").upsert(toDbRow(user.id, next));
      if (error) {
        console.error("[useSettings] failed to save settings to Supabase:", error);
        setSyncError(error.message);
      } else {
        setSyncError(null);
      }
    },
    [settings, user],
  );

  return { settings, updateSettings, loading, syncError };
}
