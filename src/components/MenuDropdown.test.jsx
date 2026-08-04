import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import MenuDropdown from "./MenuDropdown";
import { DEFAULT_SETTINGS } from "../hooks/useSettings";

describe("MenuDropdown", () => {
  it("keeps the dropdown closed until the hamburger button is clicked", () => {
    render(<MenuDropdown settings={DEFAULT_SETTINGS} onChange={() => {}} user={null} />);
    expect(screen.queryByRole("button", { name: /tiempos/i })).not.toBeInTheDocument();
  });

  it("opens the dropdown and lists all four panels", async () => {
    const user = userEvent.setup();
    render(<MenuDropdown settings={DEFAULT_SETTINGS} onChange={() => {}} user={null} />);
    await user.click(screen.getByRole("button", { name: /abrir menú/i }));

    expect(screen.getByRole("button", { name: /tiempos/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /fondo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /alarmas/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /música/i })).toBeInTheDocument();
  });

  it("only keeps one panel open at a time (accordion)", async () => {
    const user = userEvent.setup();
    render(<MenuDropdown settings={DEFAULT_SETTINGS} onChange={() => {}} user={null} />);
    await user.click(screen.getByRole("button", { name: /abrir menú/i }));

    const tiemposBtn = screen.getByRole("button", { name: /tiempos/i });
    const fondoBtn = screen.getByRole("button", { name: /fondo/i });

    await user.click(tiemposBtn);
    expect(tiemposBtn).toHaveAttribute("aria-expanded", "true");

    await user.click(fondoBtn);
    expect(fondoBtn).toHaveAttribute("aria-expanded", "true");
    expect(tiemposBtn).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the whole menu when clicking outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <div data-testid="outside">outside</div>
        <MenuDropdown settings={DEFAULT_SETTINGS} onChange={() => {}} user={null} />
      </div>,
    );
    await user.click(screen.getByRole("button", { name: /abrir menú/i }));
    expect(screen.getByRole("button", { name: /tiempos/i })).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByRole("button", { name: /tiempos/i })).not.toBeInTheDocument();
  });
});
