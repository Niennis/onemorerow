import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS, useSettings } from "./useSettings";

vi.mock("../lib/supabaseClient", () => ({
  supabase: { from: vi.fn() },
}));
import { supabase } from "../lib/supabaseClient";

const DEFAULT_DB_ROW = {
  work_duration_min: DEFAULT_SETTINGS.workDurationMin,
  short_break_min: DEFAULT_SETTINGS.shortBreakMin,
  long_break_min: DEFAULT_SETTINGS.longBreakMin,
  theme: DEFAULT_SETTINGS.theme,
  background_type: DEFAULT_SETTINGS.backgroundType,
  background_value: DEFAULT_SETTINGS.backgroundValue,
  text_tone: DEFAULT_SETTINGS.textTone,
  focus_end_sound: DEFAULT_SETTINGS.focusEndSound,
  break_end_sound: DEFAULT_SETTINGS.breakEndSound,
  alarm_volume: DEFAULT_SETTINGS.alarmVolume,
  player_url: DEFAULT_SETTINGS.playerUrl,
};

function mockSupabaseFrom({ selectResult, upsertResult = { error: null } }) {
  supabase.from.mockReturnValue({
    select: () => ({
      eq: () => ({
        maybeSingle: () => Promise.resolve(selectResult),
      }),
    }),
    upsert: () => Promise.resolve(upsertResult),
  });
}

const STORAGE_KEY = "onemorerow-settings";
const LEGACY_STORAGE_KEY = "pomodoro-settings";

beforeEach(() => {
  localStorage.clear();
  supabase.from.mockReset();
});

describe("useSettings (local-only, no user)", () => {
  it("returns the defaults when nothing is stored yet", () => {
    const { result } = renderHook(() => useSettings(null));
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });

  it("persists updates to localStorage", async () => {
    const { result } = renderHook(() => useSettings(null));

    await act(async () => {
      await result.current.updateSettings({ workDurationMin: 40 });
    });

    expect(result.current.settings.workDurationMin).toBe(40);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).workDurationMin).toBe(40);
  });

  it("picks up a previously saved value on mount", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ backgroundValue: "#123456" }));
    const { result } = renderHook(() => useSettings(null));
    expect(result.current.settings.backgroundValue).toBe("#123456");
    // unspecified fields still fall back to defaults
    expect(result.current.settings.workDurationMin).toBe(DEFAULT_SETTINGS.workDurationMin);
  });

  it("migrates settings saved under the old pre-rename key", () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ backgroundValue: "#654321" }));
    const { result } = renderHook(() => useSettings(null));

    expect(result.current.settings.backgroundValue).toBe("#654321");
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)).backgroundValue).toBe("#654321");
  });

  it("prefers the new key over the legacy one when both exist", () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ backgroundValue: "#111111" }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ backgroundValue: "#222222" }));
    const { result } = renderHook(() => useSettings(null));

    expect(result.current.settings.backgroundValue).toBe("#222222");
  });
});

const user = { id: "user-123" };

describe("useSettings (logged in)", () => {
  it("uses the account's saved settings when they're not just defaults", async () => {
    mockSupabaseFrom({
      selectResult: { data: { ...DEFAULT_DB_ROW, background_value: "#654321" }, error: null },
    });
    const { result } = renderHook(() => useSettings(user));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.settings.backgroundValue).toBe("#654321");
    expect(result.current.syncError).toBeNull();
  });

  it("adopts local settings into a freshly-created account still at defaults", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ backgroundValue: "#abcdef" }));
    mockSupabaseFrom({ selectResult: { data: DEFAULT_DB_ROW, error: null } });
    const { result } = renderHook(() => useSettings(user));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.settings.backgroundValue).toBe("#abcdef");
  });

  it("surfaces a syncError instead of failing silently when the fetch errors", async () => {
    mockSupabaseFrom({
      selectResult: { data: null, error: { message: "column user_settings.player_url does not exist" } },
    });
    const { result } = renderHook(() => useSettings(user));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.syncError).toMatch(/player_url/);
  });

  it("surfaces a syncError instead of failing silently when a save fails", async () => {
    mockSupabaseFrom({
      selectResult: { data: DEFAULT_DB_ROW, error: null },
      upsertResult: { error: { message: "column user_settings.player_url does not exist" } },
    });
    const { result } = renderHook(() => useSettings(user));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateSettings({ backgroundValue: "#ff0000" });
    });

    expect(result.current.syncError).toMatch(/player_url/);
    // the UI still reflects the change locally even though the save failed
    expect(result.current.settings.backgroundValue).toBe("#ff0000");
  });

  it("clears a previous syncError once a save succeeds", async () => {
    mockSupabaseFrom({
      selectResult: { data: DEFAULT_DB_ROW, error: null },
      upsertResult: { error: null },
    });
    const { result } = renderHook(() => useSettings(user));
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateSettings({ backgroundValue: "#00ff00" });
    });

    expect(result.current.syncError).toBeNull();
  });
});
