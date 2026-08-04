import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBackgroundTone } from "./useBackgroundTone";

describe("useBackgroundTone", () => {
  it("respects a manual light override regardless of the background color", () => {
    const { result } = renderHook(() =>
      useBackgroundTone({ backgroundType: "color", backgroundValue: "#000000", textTone: "light" }),
    );
    expect(result.current).toBe("light");
  });

  it("respects a manual dark override regardless of the background color", () => {
    const { result } = renderHook(() =>
      useBackgroundTone({ backgroundType: "color", backgroundValue: "#ffffff", textTone: "dark" }),
    );
    expect(result.current).toBe("dark");
  });

  it("auto-detects from a solid color when textTone is auto", () => {
    const { result } = renderHook(() =>
      useBackgroundTone({ backgroundType: "color", backgroundValue: "#ffffff", textTone: "auto" }),
    );
    expect(result.current).toBe("light");
  });

  it("auto-detects from a gradient when textTone is auto", () => {
    const { result } = renderHook(() =>
      useBackgroundTone({
        backgroundType: "gradient",
        backgroundValue: "linear-gradient(135deg, #000000, #111111)",
        textTone: "auto",
      }),
    );
    expect(result.current).toBe("dark");
  });
});
