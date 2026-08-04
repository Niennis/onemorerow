import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import BackgroundPicker from "./BackgroundPicker";
import { DEFAULT_SETTINGS } from "../hooks/useSettings";
import { DEFAULT_IMAGES } from "../lib/defaultImages";

describe("BackgroundPicker (no user / local mode)", () => {
  it("selecting a gradient preset reports a linear-gradient value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BackgroundPicker settings={DEFAULT_SETTINGS} onChange={onChange} user={null} />);

    await user.click(screen.getByRole("button", { name: "Gradiente" }));
    const [firstPreset] = document.querySelectorAll("button[style*='linear-gradient']");
    fireEvent.click(firstPreset);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ backgroundType: "gradient" }),
    );
  });

  it("selecting a default pool image reports it as the background", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BackgroundPicker settings={DEFAULT_SETTINGS} onChange={onChange} user={null} />);

    await user.click(screen.getByRole("button", { name: "Imagen" }));
    // Thumbnails use alt="" (decorative), so they aren't exposed via role "img".
    const firstImage = document.querySelector("img");
    fireEvent.click(firstImage.closest("button"));

    expect(onChange).toHaveBeenCalledWith({
      backgroundType: "image",
      backgroundValue: DEFAULT_IMAGES[0],
    });
  });

  it("blocks uploads when the user is logged out", async () => {
    const user = userEvent.setup();
    render(<BackgroundPicker settings={DEFAULT_SETTINGS} onChange={() => {}} user={null} />);

    await user.click(screen.getByRole("button", { name: "Imagen" }));
    const file = new File(["fake"], "photo.png", { type: "image/png" });
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });

    expect(await screen.findByText(/crea una cuenta/i)).toBeInTheDocument();
  });
});
