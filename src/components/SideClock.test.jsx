import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SideClock from "./SideClock";

describe("SideClock", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the current time by default", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 1, 9, 5, 3));
    render(<SideClock />);
    expect(screen.getByText("09:05:03")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("toggles visibility when the button is clicked", async () => {
    const user = userEvent.setup();
    render(<SideClock />);
    const toggle = screen.getByRole("button", { name: "Reloj on/off" });
    expect(toggle).toHaveAttribute("aria-pressed", "true");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("persists visibility to localStorage", async () => {
    const user = userEvent.setup();
    render(<SideClock />);
    await user.click(screen.getByRole("button", { name: "Reloj on/off" }));
    expect(localStorage.getItem("onemorerow-side-clock-visible")).toBe("false");
  });
});
