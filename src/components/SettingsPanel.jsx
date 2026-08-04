const FIELDS = [
  { key: "workDurationMin", label: "Enfoque", min: 1, max: 180 },
  { key: "shortBreakMin", label: "Descanso corto", min: 1, max: 60 },
  { key: "longBreakMin", label: "Descanso largo", min: 1, max: 120 },
];

export default function SettingsPanel({ settings, onChange }) {
  const handleInput = (key, min, max) => (event) => {
    const value = Number(event.target.value);
    if (Number.isNaN(value)) return;
    onChange({ [key]: Math.min(max, Math.max(min, value)) });
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-5 rounded-2xl border border-[var(--tone-housing-border)] bg-[var(--tone-housing-bg)] px-6 py-5 backdrop-blur-xl">
      {FIELDS.map(({ key, label, min, max }) => (
        <label key={key} className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--tone-text-muted)]">
            {label}
          </span>
          <input
            type="number"
            min={min}
            max={max}
            value={settings[key]}
            onChange={handleInput(key, min, max)}
            className="w-20 rounded-lg border border-[var(--tone-housing-border)] bg-[var(--tone-input-bg)] px-2 py-1.5 text-center font-display text-lg font-medium text-[var(--tone-input-text)] tabular-nums outline-none focus:border-[var(--accent)]"
          />
          <span className="text-[10px] text-[var(--tone-text-muted)]">min</span>
        </label>
      ))}
    </div>
  );
}
