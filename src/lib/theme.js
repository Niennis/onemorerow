// Fixed brand accent (stays constant across any user background).
export const ACCENT = "#e0742c";
export const ACCENT_SOFT = "rgba(224, 116, 44, 0.35)";

// "Glass housing" tokens: the instrument panel flips between these two
// tones depending on how light/dark the current background is, so the
// timer stays legible no matter what the user picks.
export const GLASS_THEMES = {
  dark: {
    "--tone-text": "#f5efe6",
    "--tone-text-muted": "rgba(245, 239, 230, 0.68)",
    "--tone-housing-bg": "rgba(24, 20, 16, 0.55)",
    "--tone-housing-border": "rgba(245, 239, 230, 0.16)",
    "--tone-tick": "rgba(245, 239, 230, 0.32)",
    "--tone-input-bg": "rgba(245, 239, 230, 0.12)",
    "--tone-input-text": "#f5efe6",
  },
  light: {
    "--tone-text": "#241c14",
    "--tone-text-muted": "rgba(36, 28, 20, 0.65)",
    "--tone-housing-bg": "rgba(255, 250, 240, 0.62)",
    "--tone-housing-border": "rgba(36, 28, 20, 0.14)",
    "--tone-tick": "rgba(36, 28, 20, 0.28)",
    "--tone-input-bg": "rgba(36, 28, 20, 0.07)",
    "--tone-input-text": "#241c14",
  },
};

export function cssVarsForTone(tone) {
  return { ...GLASS_THEMES[tone], "--accent": ACCENT, "--accent-soft": ACCENT_SOFT };
}
