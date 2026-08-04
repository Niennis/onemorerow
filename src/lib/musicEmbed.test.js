import { describe, expect, it } from "vitest";
import { parsePlayerUrl } from "./musicEmbed";

describe("parsePlayerUrl / Spotify", () => {
  it("parses a playlist link", () => {
    expect(parsePlayerUrl("https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=abc")).toEqual({
      provider: "spotify",
      embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?theme=0",
    });
  });

  it("parses an album link", () => {
    expect(parsePlayerUrl("https://open.spotify.com/album/abc123")).toEqual({
      provider: "spotify",
      embedUrl: "https://open.spotify.com/embed/album/abc123?theme=0",
    });
  });

  it("parses a track link", () => {
    expect(parsePlayerUrl("https://open.spotify.com/track/xyz789")).toEqual({
      provider: "spotify",
      embedUrl: "https://open.spotify.com/embed/track/xyz789?theme=0",
    });
  });

  it("accepts an already-embed link", () => {
    expect(parsePlayerUrl("https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M")).toEqual({
      provider: "spotify",
      embedUrl: "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M?theme=0",
    });
  });
});

describe("parsePlayerUrl / YouTube", () => {
  it("parses a playlist link", () => {
    expect(parsePlayerUrl("https://www.youtube.com/playlist?list=PL12345")).toEqual({
      provider: "youtube",
      embedUrl: "https://www.youtube.com/embed/videoseries?list=PL12345",
    });
  });

  it("parses a single video link", () => {
    expect(parsePlayerUrl("https://www.youtube.com/watch?v=abcdefghijk")).toEqual({
      provider: "youtube",
      embedUrl: "https://www.youtube.com/embed/abcdefghijk",
    });
  });

  it("parses a video-within-playlist link", () => {
    expect(parsePlayerUrl("https://www.youtube.com/watch?v=abcdefghijk&list=PL999")).toEqual({
      provider: "youtube",
      embedUrl: "https://www.youtube.com/embed/abcdefghijk?list=PL999",
    });
  });

  it("parses a youtu.be short link", () => {
    expect(parsePlayerUrl("https://youtu.be/abcdefghijk")).toEqual({
      provider: "youtube",
      embedUrl: "https://www.youtube.com/embed/abcdefghijk",
    });
  });

  it("parses a youtu.be short link with a playlist", () => {
    expect(parsePlayerUrl("https://youtu.be/abcdefghijk?list=PL999")).toEqual({
      provider: "youtube",
      embedUrl: "https://www.youtube.com/embed/abcdefghijk?list=PL999",
    });
  });
});

describe("parsePlayerUrl / invalid input", () => {
  it("returns null for garbage text", () => {
    expect(parsePlayerUrl("not a url")).toBeNull();
  });

  it("returns null for an unrelated site", () => {
    expect(parsePlayerUrl("https://example.com/playlist?list=1")).toBeNull();
  });

  it("returns null for an empty string", () => {
    expect(parsePlayerUrl("")).toBeNull();
  });
});
