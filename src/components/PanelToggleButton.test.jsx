import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PanelToggleButton from "./PanelToggleButton";

describe("PanelToggleButton", () => {
  it("reflects the open prop via aria-expanded", () => {
    const { rerender } = render(
      <PanelToggleButton icon="⏱" title="Tiempos" open={false} onClick={() => {}} />,
    );
    expect(screen.getByRole("button", { name: /tiempos/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    rerender(<PanelToggleButton icon="⏱" title="Tiempos" open={true} onClick={() => {}} />);
    expect(screen.getByRole("button", { name: /tiempos/i })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("calls onClick when pressed", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<PanelToggleButton icon="🎨" title="Fondo" open={false} onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: /fondo/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
