import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SettingsPanel from "./SettingsPanel";
import { DEFAULT_SETTINGS } from "../hooks/useSettings";

describe("SettingsPanel", () => {
  it("renders the three duration fields with their current values", () => {
    render(<SettingsPanel settings={DEFAULT_SETTINGS} onChange={() => {}} />);
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs).toHaveLength(3);
    expect(inputs[0]).toHaveValue(DEFAULT_SETTINGS.workDurationMin);
    expect(inputs[1]).toHaveValue(DEFAULT_SETTINGS.shortBreakMin);
    expect(inputs[2]).toHaveValue(DEFAULT_SETTINGS.longBreakMin);
  });

  it("clamps values above the max", () => {
    const onChange = vi.fn();
    render(<SettingsPanel settings={DEFAULT_SETTINGS} onChange={onChange} />);
    const [workInput] = screen.getAllByRole("spinbutton");
    fireEvent.change(workInput, { target: { value: "999" } });
    expect(onChange).toHaveBeenCalledWith({ workDurationMin: 180 });
  });

  it("clamps values below the min", () => {
    const onChange = vi.fn();
    render(<SettingsPanel settings={DEFAULT_SETTINGS} onChange={onChange} />);
    const [workInput] = screen.getAllByRole("spinbutton");
    fireEvent.change(workInput, { target: { value: "-5" } });
    expect(onChange).toHaveBeenCalledWith({ workDurationMin: 1 });
  });
});
