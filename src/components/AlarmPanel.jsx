import { ALARM_SOUNDS, playAlarm } from "../lib/alarm";

const SOUND_FIELDS = [
  { key: "focusEndSound", label: "Fin de enfoque" },
  { key: "breakEndSound", label: "Fin de descanso" },
];

export default function AlarmPanel({ settings, onChange }) {
  const preview = (soundId) => playAlarm(soundId, settings.alarmVolume);

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--tone-housing-border)] bg-[var(--tone-housing-bg)] px-6 py-5 backdrop-blur-xl">
      {SOUND_FIELDS.map(({ key, label }) => (
        <div key={key} className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--tone-text-muted)]">
            {label}
          </span>
          <div className="flex items-center gap-2">
            <select
              value={settings[key]}
              onChange={(e) => onChange({ [key]: e.target.value })}
              className="modern-select rounded-lg border border-[var(--tone-housing-border)] bg-[var(--tone-input-bg)] px-3 py-1.5 text-sm text-[var(--tone-input-text)] outline-none focus:border-[var(--accent)]"
            >
              {ALARM_SOUNDS.map((sound) => (
                <option key={sound.id} value={sound.id}>
                  {sound.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => preview(settings[key])}
              disabled={settings[key] === "none"}
              aria-label={`Previsualizar sonido: ${label}`}
              className="rounded-full border border-[var(--tone-housing-border)] px-3 py-1.5 text-sm text-[var(--tone-text)] transition hover:border-[var(--accent)] disabled:opacity-40"
            >
              ▶
            </button>
          </div>
        </div>
      ))}

      <label className="flex w-full max-w-xs flex-col items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--tone-text-muted)]">
          Volumen
        </span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.alarmVolume}
          onChange={(e) => onChange({ alarmVolume: Number(e.target.value) })}
          className="w-full accent-[var(--accent)]"
        />
      </label>
    </div>
  );
}
