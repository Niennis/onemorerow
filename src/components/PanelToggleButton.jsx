export default function PanelToggleButton({ icon, title, open, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className="flex items-center gap-2 rounded-full border border-[var(--tone-housing-border)] bg-[var(--tone-housing-bg)] px-5 py-2 text-sm font-medium tracking-wide text-[var(--tone-text)] backdrop-blur-xl transition hover:border-[var(--accent)]"
    >
      <span aria-hidden>{icon}</span>
      {title}
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
      >
        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
