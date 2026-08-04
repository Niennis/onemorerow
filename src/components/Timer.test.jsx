import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Timer from "./Timer";

function makeTimer(overrides = {}) {
  return {
    mode: "work",
    modeLabel: "Enfoque",
    secondsLeft: 1500,
    formatted: "25:00",
    progress: 0,
    isRunning: false,
    start: vi.fn(),
    pause: vi.fn(),
    reset: vi.fn(),
    skip: vi.fn(),
    cycleIndex: 0,
    ...overrides,
  };
}

describe("Timer", () => {
  it("shows the formatted time and mode label", () => {
    render(<Timer timer={makeTimer()} />);
    expect(screen.getByText("25:00")).toBeInTheDocument();
    expect(screen.getByText("Enfoque")).toBeInTheDocument();
  });

  it("shows Iniciar when idle and calls start on click", async () => {
    const user = userEvent.setup();
    const timer = makeTimer();
    render(<Timer timer={timer} />);
    await user.click(screen.getByRole("button", { name: "Iniciar" }));
    expect(timer.start).toHaveBeenCalled();
  });

  it("shows Pausar when running and calls pause on click", async () => {
    const user = userEvent.setup();
    const timer = makeTimer({ isRunning: true });
    render(<Timer timer={timer} />);
    await user.click(screen.getByRole("button", { name: "Pausar" }));
    expect(timer.pause).toHaveBeenCalled();
  });

  it("calls reset and skip from their buttons", async () => {
    const user = userEvent.setup();
    const timer = makeTimer();
    render(<Timer timer={timer} />);
    await user.click(screen.getByRole("button", { name: "Reiniciar" }));
    await user.click(screen.getByRole("button", { name: "Saltar" }));
    expect(timer.reset).toHaveBeenCalled();
    expect(timer.skip).toHaveBeenCalled();
  });

  it("paints exactly cycleIndex dots in the session progress row", () => {
    render(<Timer timer={makeTimer({ cycleIndex: 2 })} />);
    const dots = document.querySelectorAll('[aria-label="Progreso de sesiones"] span');
    expect(dots).toHaveLength(4);
    const painted = Array.from(dots).filter((dot) =>
      dot.getAttribute("style").includes("var(--accent)"),
    );
    expect(painted).toHaveLength(2);
  });
});
