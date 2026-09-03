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

  it("disables the reset button when there are no pokemons", () => {
    render(<SideClock pokemonCount={0} onResetPokemons={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Resetear monitos" })).toBeDisabled();
  });

  it("asks for confirmation and calls onResetPokemons when confirmed", async () => {
    const user = userEvent.setup();
    const onResetPokemons = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<SideClock pokemonCount={3} onResetPokemons={onResetPokemons} />);

    await user.click(screen.getByRole("button", { name: "Resetear monitos" }));

    expect(window.confirm).toHaveBeenCalled();
    expect(onResetPokemons).toHaveBeenCalledTimes(1);
    window.confirm.mockRestore();
  });

  it("does not reset when the confirmation is declined", async () => {
    const user = userEvent.setup();
    const onResetPokemons = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<SideClock pokemonCount={3} onResetPokemons={onResetPokemons} />);

    await user.click(screen.getByRole("button", { name: "Resetear monitos" }));

    expect(onResetPokemons).not.toHaveBeenCalled();
    window.confirm.mockRestore();
  });
});
