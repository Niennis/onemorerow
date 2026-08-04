import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AlarmPanel from "./AlarmPanel";
import { DEFAULT_SETTINGS } from "../hooks/useSettings";

vi.mock("../lib/alarm", async () => {
  const actual = await vi.importActual("../lib/alarm");
  return { ...actual, playAlarm: vi.fn() };
});
import { playAlarm } from "../lib/alarm";

describe("AlarmPanel", () => {
  it("changing the focus-end sound reports the new id", () => {
    const onChange = vi.fn();
    render(<AlarmPanel settings={DEFAULT_SETTINGS} onChange={onChange} />);
    const [focusSelect] = screen.getAllByRole("combobox");
    fireEvent.change(focusSelect, { target: { value: "none" } });
    expect(onChange).toHaveBeenCalledWith({ focusEndSound: "none" });
  });

  it("moving the volume slider reports a number", () => {
    const onChange = vi.fn();
    render(<AlarmPanel settings={DEFAULT_SETTINGS} onChange={onChange} />);
    fireEvent.change(screen.getByRole("slider"), { target: { value: "0.2" } });
    expect(onChange).toHaveBeenCalledWith({ alarmVolume: 0.2 });
  });

  it("disables preview when the sound is set to none, enables it otherwise", () => {
    render(
      <AlarmPanel
        settings={{ ...DEFAULT_SETTINGS, focusEndSound: "none" }}
        onChange={() => {}}
      />,
    );
    const [focusPreview] = screen.getAllByRole("button");
    expect(focusPreview).toBeDisabled();
  });

  it("clicking preview plays the currently selected sound", async () => {
    const user = userEvent.setup();
    render(<AlarmPanel settings={DEFAULT_SETTINGS} onChange={() => {}} />);
    const [focusPreview] = screen.getAllByRole("button");
    await user.click(focusPreview);
    expect(playAlarm).toHaveBeenCalledWith(DEFAULT_SETTINGS.focusEndSound, DEFAULT_SETTINGS.alarmVolume);
  });
});
