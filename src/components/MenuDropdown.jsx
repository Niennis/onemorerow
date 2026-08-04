import { useEffect, useRef, useState } from "react";
import SettingsPanel from "./SettingsPanel";
import BackgroundPicker from "./BackgroundPicker";
import AlarmPanel from "./AlarmPanel";
import MusicPanel from "./MusicPanel";
import PanelToggleButton from "./PanelToggleButton";
import PanelContent from "./PanelContent";

const ITEMS = [
  { key: "tiempos", icon: "⏱", title: "Tiempos" },
  { key: "fondo", icon: "🎨", title: "Fondo" },
  { key: "alarmas", icon: "🔔", title: "Alarmas" },
  { key: "musica", icon: "🎵", title: "Música" },
];

export default function MenuDropdown({ settings, onChange, user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openKey, setOpenKey] = useState(null); // accordion: only one panel open at a time
  const containerRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const toggleMenu = () => setMenuOpen((v) => !v);
  const toggleItem = (key) => setOpenKey((prev) => (prev === key ? null : key));

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleMenu}
        aria-expanded={menuOpen}
        aria-label="Abrir menú"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--tone-housing-border)] bg-[var(--tone-housing-bg)] text-[var(--tone-text)] backdrop-blur-xl transition hover:border-[var(--accent)]"
      >
        <span className="flex flex-col gap-[5px]">
          <span
            className={`h-[2px] w-5 rounded-full bg-current transition-transform duration-300 ${
              menuOpen ? "translate-y-[7px] rotate-45" : ""
            }`}
          />
          <span
            className={`h-[2px] w-5 rounded-full bg-current transition-opacity duration-300 ${
              menuOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`h-[2px] w-5 rounded-full bg-current transition-transform duration-300 ${
              menuOpen ? "-translate-y-[7px] -rotate-45" : ""
            }`}
          />
        </span>
      </button>

      {/* Absolutely positioned: a separate layer that floats over the page
          instead of pushing the timer/layout below it. */}
      {menuOpen && (
        <div className="absolute right-0 z-20 mt-2 flex max-h-[75vh] w-[min(22rem,calc(100vw-2rem))] flex-col items-start gap-2 overflow-y-auto rounded-2xl border border-[var(--tone-housing-border)] bg-[var(--tone-housing-bg)] p-3 backdrop-blur-xl">
          {ITEMS.map(({ key, icon, title }) => (
            <div key={key} className="w-full">
              <PanelToggleButton
                icon={icon}
                title={title}
                open={openKey === key}
                onClick={() => toggleItem(key)}
              />
              <PanelContent open={openKey === key}>
                {key === "tiempos" && <SettingsPanel settings={settings} onChange={onChange} />}
                {key === "fondo" && (
                  <BackgroundPicker settings={settings} onChange={onChange} user={user} />
                )}
                {key === "alarmas" && <AlarmPanel settings={settings} onChange={onChange} />}
                {key === "musica" && <MusicPanel settings={settings} onChange={onChange} />}
              </PanelContent>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
