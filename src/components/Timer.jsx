const CENTER = 140;
const PROGRESS_RADIUS = 116;
const CIRCUMFERENCE = 2 * Math.PI * PROGRESS_RADIUS;
const TICK_COUNT = 60;
const TICK_OUTER_R = 134;
const MINOR_LEN = 7;
const MAJOR_LEN = 15;

const TICKS = Array.from({ length: TICK_COUNT }, (_, i) => {
  const angle = (i / TICK_COUNT) * Math.PI * 2;
  const isMajor = i % 5 === 0;
  const innerR = TICK_OUTER_R - (isMajor ? MAJOR_LEN : MINOR_LEN);
  return {
    key: i,
    isMajor,
    x1: CENTER + innerR * Math.cos(angle),
    y1: CENTER + innerR * Math.sin(angle),
    x2: CENTER + TICK_OUTER_R * Math.cos(angle),
    y2: CENTER + TICK_OUTER_R * Math.sin(angle),
  };
});

const SESSION_SLOTS = 4;

export default function Timer({ timer }) {
  const { modeLabel, formatted, progress, isRunning, start, pause, reset, skip, cycleIndex } =
    timer;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-8 px-4">
      <div className="relative flex h-64 w-64 items-center justify-center sm:h-72 sm:w-72 md:h-[300px] md:w-[300px]">
        <svg
          className="absolute inset-0 h-full w-full -rotate-90"
          viewBox={`0 0 ${CENTER * 2} ${CENTER * 2}`}
        >
          {TICKS.map((t) => (
            <line
              key={t.key}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="var(--tone-tick)"
              strokeWidth={t.isMajor ? 2.5 : 1.25}
              strokeLinecap="round"
            />
          ))}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={PROGRESS_RADIUS}
            fill="none"
            stroke="var(--tone-housing-border)"
            strokeWidth="3"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={PROGRESS_RADIUS}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-500 ease-linear"
          />
        </svg>

        {/* Frosted "dial face" behind the numbers: guarantees legibility even
            when auto-detected tone slightly mismatches a busy photo. */}
        <div className="absolute inset-[8.5%] rounded-full border border-[var(--tone-housing-border)] bg-[var(--tone-housing-bg)] backdrop-blur-xl" />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--tone-text)]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--tone-text-muted)]">
            {modeLabel}
          </span>
          <span className="font-display text-5xl font-medium tabular-nums sm:text-6xl">
            {formatted}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5" aria-label="Progreso de sesiones">
        {Array.from({ length: SESSION_SLOTS }, (_, i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full transition-colors"
            style={{
              background: i < cycleIndex ? "var(--accent)" : "var(--tone-tick)",
            }}
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        {isRunning ? (
          <button
            onClick={pause}
            className="rounded-full px-8 py-3 font-semibold text-[#1a1006] shadow-lg transition hover:brightness-110 active:brightness-95"
            style={{ background: "var(--accent)" }}
          >
            Pausar
          </button>
        ) : (
          <button
            onClick={start}
            className="rounded-full px-8 py-3 font-semibold text-[#1a1006] shadow-lg transition hover:brightness-110 active:brightness-95"
            style={{ background: "var(--accent)" }}
          >
            Iniciar
          </button>
        )}
        <button
          onClick={reset}
          className="rounded-full border border-[var(--tone-housing-border)] bg-[var(--tone-housing-bg)] px-5 py-3 font-medium text-[var(--tone-text)] backdrop-blur-xl transition hover:border-[var(--accent)]"
        >
          Reiniciar
        </button>
        <button
          onClick={skip}
          className="rounded-full border border-[var(--tone-housing-border)] bg-[var(--tone-housing-bg)] px-5 py-3 font-medium text-[var(--tone-text)] backdrop-blur-xl transition hover:border-[var(--accent)]"
        >
          Saltar
        </button>
      </div>
    </div>
  );
}
