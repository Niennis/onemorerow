import { useEffect, useState } from "react";

const STORAGE_KEY = "onemorerow-side-clock-visible";

const CENTER = 72;
const TICK_OUTER_R = 68;
const TICK_COUNT = 60;
const MINOR_LEN = 4;
const MAJOR_LEN = 9;

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

function readVisible() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === null ? true : raw === "true";
  } catch {
    return true;
  }
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function formatTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export default function SideClock() {
  const [visible, setVisible] = useState(readVisible);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(visible));
    } catch {
      // localStorage unavailable (private mode, etc.) — visibility just won't persist.
    }
  }, [visible]);

  return (
    <>
      {/* Flush against the screen edge, independent of the clock's own
          position so it never drifts when the clock is toggled. */}
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-pressed={visible}
        aria-label="Reloj on/off"
        className="group fixed left-0 top-1/2 z-20 hidden -translate-y-1/2 items-center gap-2 rounded-r-full border border-l-0 border-[var(--tone-housing-border)] bg-[var(--tone-housing-bg)] py-3 pl-2 pr-2 text-[var(--tone-text)] opacity-40 backdrop-blur-xl transition-all duration-300 hover:pr-4 hover:opacity-100 md:flex"
      >
        <span aria-hidden>🕐</span>
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-xs font-medium tracking-wide opacity-0 transition-all duration-300 group-hover:max-w-[7rem] group-hover:opacity-100">
          Reloj {visible ? "on" : "off"}
        </span>
      </button>

      {/* Centered on the exact center of the left third of the viewport
          (16.667vw, 50vh), regardless of the edge-pinned toggle button. */}
      <div
        className={`fixed left-[16.667%] top-1/2 z-20 hidden -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out md:block ${
          visible ? "scale-100 opacity-100" : "pointer-events-none scale-75 opacity-0"
        }`}
      >
        <div className="relative flex h-36 w-36 items-center justify-center">
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
                strokeWidth={t.isMajor ? 2 : 1}
                strokeLinecap="round"
              />
            ))}
            <circle
              cx={CENTER}
              cy={CENTER}
              r={TICK_OUTER_R - MAJOR_LEN - 2}
              fill="none"
              stroke="var(--tone-housing-border)"
              strokeWidth="2"
            />
          </svg>

          <div className="absolute inset-[10%] rounded-full border border-[var(--tone-housing-border)] bg-[var(--tone-housing-bg)] backdrop-blur-xl" />

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[var(--tone-text)]">
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--tone-text-muted)]">
              Hora
            </span>
            <span className="font-display text-lg font-medium tabular-nums">
              {formatTime(now)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
