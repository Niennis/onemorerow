import { useEffect, useState } from "react";
import { luminanceOfHex, luminanceOfGradient, sampleImageLuminance, toneFromLuminance } from "../lib/contrast";

// Figures out whether the current background reads as "light" or "dark"
// so the instrument panel can flip its glass tone for legibility.
export function useBackgroundTone(settings) {
  const [tone, setTone] = useState("dark");

  useEffect(() => {
    let cancelled = false;

    if (settings.textTone === "light" || settings.textTone === "dark") {
      setTone(settings.textTone);
      return undefined;
    }

    if (settings.backgroundType === "color") {
      setTone(toneFromLuminance(luminanceOfHex(settings.backgroundValue)));
      return undefined;
    }

    if (settings.backgroundType === "gradient") {
      setTone(toneFromLuminance(luminanceOfGradient(settings.backgroundValue)));
      return undefined;
    }

    // image: sample asynchronously, keep the previous tone until it resolves
    // to avoid flashing, and fall back to "dark" if sampling fails (CORS etc).
    sampleImageLuminance(settings.backgroundValue)
      .then((lum) => {
        if (!cancelled) setTone(toneFromLuminance(lum));
      })
      .catch(() => {
        if (!cancelled) setTone("dark");
      });

    return () => {
      cancelled = true;
    };
  }, [settings.backgroundType, settings.backgroundValue, settings.textTone]);

  return tone;
}
