// A small built-in alarm pool synthesized with the Web Audio API — no audio
// files to license, host, or download; works the same for every user.
export const ALARM_SOUNDS = [
  { id: "none", label: "Sin sonido" },
  { id: "beep", label: "Beep clásico" },
  { id: "bell", label: "Campana suave" },
  { id: "double", label: "Doble tono" },
  { id: "chime", label: "Repique ascendente" },
];

let audioCtx;

function getAudioContext() {
  const Ctor = typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext);
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  return audioCtx;
}

// Call from a real click handler (e.g. the Start button) so the browser's
// autoplay policy lets the context run before we need to play a sound later.
export function unlockAudioContext() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") ctx.resume();
}

function tone(ctx, { freq, start, duration, volume, type = "sine" }) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ctx.currentTime + start);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + duration + 0.05);
}

const PATTERNS = {
  beep: (ctx, volume) => {
    tone(ctx, { freq: 880, start: 0, duration: 0.18, volume });
    tone(ctx, { freq: 880, start: 0.26, duration: 0.18, volume });
  },
  bell: (ctx, volume) => {
    tone(ctx, { freq: 660, start: 0, duration: 0.9, volume });
    tone(ctx, { freq: 990, start: 0, duration: 0.9, volume: volume * 0.4 });
  },
  double: (ctx, volume) => {
    tone(ctx, { freq: 523.25, start: 0, duration: 0.15, volume });
    tone(ctx, { freq: 783.99, start: 0.18, duration: 0.15, volume });
  },
  chime: (ctx, volume) => {
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      tone(ctx, { freq, start: i * 0.14, duration: 0.3, volume });
    });
  },
};

export function playAlarm(soundId, volume = 0.6) {
  const pattern = PATTERNS[soundId];
  if (!pattern) return; // "none" or unknown id: stay silent

  const ctx = getAudioContext();
  if (!ctx) return; // Web Audio unsupported in this environment

  if (ctx.state === "suspended") ctx.resume();
  pattern(ctx, volume);
}
