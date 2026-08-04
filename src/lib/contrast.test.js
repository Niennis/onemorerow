import { describe, expect, it } from "vitest";
import { luminanceOfHex, luminanceOfGradient, toneFromLuminance } from "./contrast";

describe("luminanceOfHex", () => {
  it("returns ~1 for white", () => {
    expect(luminanceOfHex("#ffffff")).toBeCloseTo(1, 2);
  });

  it("returns ~0 for black", () => {
    expect(luminanceOfHex("#000000")).toBeCloseTo(0, 2);
  });

  it("supports 3-digit hex", () => {
    expect(luminanceOfHex("#fff")).toBeCloseTo(1, 2);
  });
});

describe("luminanceOfGradient", () => {
  it("averages the luminance of the colors in the gradient string", () => {
    const css = "linear-gradient(135deg, #ffffff, #000000)";
    expect(luminanceOfGradient(css)).toBeCloseTo(0.5, 1);
  });

  it("falls back to a mid value when no hex colors are found", () => {
    expect(luminanceOfGradient("linear-gradient(135deg, red, blue)")).toBe(0.5);
  });
});

describe("toneFromLuminance", () => {
  it("classifies bright backgrounds as light", () => {
    expect(toneFromLuminance(0.9)).toBe("light");
  });

  it("classifies dark backgrounds as dark", () => {
    expect(toneFromLuminance(0.1)).toBe("dark");
  });
});
