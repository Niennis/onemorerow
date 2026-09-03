import { useMemo } from "react";
import { useAuth } from "./hooks/useAuth";
import { useSettings } from "./hooks/useSettings";
import { useTimer } from "./hooks/useTimer";
import { useBackgroundTone } from "./hooks/useBackgroundTone";
import { cssVarsForTone } from "./lib/theme";
import Timer from "./components/Timer";
import AuthPanel from "./components/AuthPanel";
import MenuDropdown from "./components/MenuDropdown";
import SideClock from "./components/SideClock";

function backgroundStyle(settings) {
  if (settings.backgroundType === "gradient") {
    return { background: settings.backgroundValue };
  }
  if (settings.backgroundType === "image") {
    return {
      backgroundImage: `url(${settings.backgroundValue})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return { backgroundColor: settings.backgroundValue };
}

export default function App() {
  const auth = useAuth();
  const { settings, updateSettings, syncError } = useSettings(auth.user);
  const timer = useTimer(settings);
  const tone = useBackgroundTone(settings);

  const style = useMemo(
    () => ({ ...backgroundStyle(settings), ...cssVarsForTone(tone) }),
    [settings, tone],
  );

  return (
    <div style={style} className="flex min-h-screen flex-col transition-colors duration-500">
      <SideClock />

      <header className="flex items-center justify-end gap-3 p-4">
        <AuthPanel auth={auth} syncError={syncError} />
        <MenuDropdown settings={settings} onChange={updateSettings} user={auth.user} />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
        <Timer timer={timer} />
      </main>
    </div>
  );
}
