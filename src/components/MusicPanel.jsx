import { useState } from "react";
import { parsePlayerUrl } from "../lib/musicEmbed";

const IFRAME_ALLOW = {
  spotify: "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture",
  youtube: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
};

export default function MusicPanel({ settings, onChange }) {
  const [input, setInput] = useState(settings.playerUrl ?? "");
  const [error, setError] = useState("");

  const embed = settings.playerUrl ? parsePlayerUrl(settings.playerUrl) : null;

  const save = (event) => {
    event.preventDefault();
    const trimmed = input.trim();

    if (!trimmed) {
      setError("");
      onChange({ playerUrl: "" });
      return;
    }

    const parsed = parsePlayerUrl(trimmed);
    if (!parsed) {
      setError("No reconozco ese link. Pega una playlist/álbum/track de Spotify o un video/playlist de YouTube.");
      return;
    }

    setError("");
    onChange({ playerUrl: trimmed });
  };

  const clear = () => {
    setInput("");
    setError("");
    onChange({ playerUrl: "" });
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--tone-housing-border)] bg-[var(--tone-housing-bg)] px-6 py-5 backdrop-blur-xl">
      <form onSubmit={save} className="flex w-full max-w-md items-center gap-2">
        <input
          type="text"
          inputMode="url"
          placeholder="Pega un link de Spotify o YouTube"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="flex-1 rounded-lg border border-[var(--tone-housing-border)] bg-[var(--tone-input-bg)] px-3 py-2 text-sm text-[var(--tone-input-text)] outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-[#1a1006]"
          style={{ background: "var(--accent)" }}
        >
          Guardar
        </button>
      </form>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {embed && (
        <div className="w-full max-w-md">
          <iframe
            key={embed.embedUrl}
            src={embed.embedUrl}
            width="100%"
            height={embed.provider === "spotify" ? 152 : 200}
            frameBorder="0"
            allow={IFRAME_ALLOW[embed.provider]}
            loading="lazy"
            className="rounded-xl"
            title="Reproductor de música"
          />
          <button
            type="button"
            onClick={clear}
            className="mt-2 text-xs text-[var(--tone-text-muted)] underline hover:text-[var(--tone-text)]"
          >
            Quitar reproductor
          </button>
        </div>
      )}
    </div>
  );
}
