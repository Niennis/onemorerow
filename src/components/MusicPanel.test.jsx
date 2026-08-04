import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MusicPanel from "./MusicPanel";
import { DEFAULT_SETTINGS } from "../hooks/useSettings";

describe("MusicPanel", () => {
  it("renders no iframe when there is no saved player url", () => {
    render(<MusicPanel settings={DEFAULT_SETTINGS} onChange={() => {}} />);
    expect(document.querySelector("iframe")).not.toBeInTheDocument();
  });

  it("saves a valid Spotify playlist link and renders its embed", () => {
    const onChange = vi.fn();
    render(<MusicPanel settings={DEFAULT_SETTINGS} onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText(/pega un link/i), {
      target: { value: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M" },
    });
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    expect(onChange).toHaveBeenCalledWith({
      playerUrl: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M",
    });
  });

  it("shows an error and does not save an unrecognized link", () => {
    const onChange = vi.fn();
    render(<MusicPanel settings={DEFAULT_SETTINGS} onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText(/pega un link/i), {
      target: { value: "not a real link" },
    });
    fireEvent.click(screen.getByRole("button", { name: /guardar/i }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/no reconozco ese link/i)).toBeInTheDocument();
  });

  it("renders the embed iframe when settings already has a valid url", () => {
    render(
      <MusicPanel
        settings={{ ...DEFAULT_SETTINGS, playerUrl: "https://www.youtube.com/playlist?list=PL123" }}
        onChange={() => {}}
      />,
    );
    const iframe = document.querySelector("iframe");
    expect(iframe).toHaveAttribute("src", "https://www.youtube.com/embed/videoseries?list=PL123");
  });

  it("clears the saved player url", () => {
    const onChange = vi.fn();
    render(
      <MusicPanel
        settings={{ ...DEFAULT_SETTINGS, playerUrl: "https://www.youtube.com/playlist?list=PL123" }}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /quitar reproductor/i }));
    expect(onChange).toHaveBeenCalledWith({ playerUrl: "" });
  });
});
