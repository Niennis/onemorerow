import { useState } from "react";

export default function AuthPanel({ auth, syncError }) {
  const { user, signIn, signUp, signOut, isSupabaseConfigured } = auth;
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isSupabaseConfigured) {
    return (
      <div className="rounded-full border border-[var(--tone-housing-border)] bg-[var(--tone-housing-bg)] px-4 py-1 text-xs text-[var(--tone-text-muted)] backdrop-blur-xl">
        Modo local (configura Supabase para sincronizar entre dispositivos)
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3 rounded-full border border-[var(--tone-housing-border)] bg-[var(--tone-housing-bg)] px-4 py-2 text-sm text-[var(--tone-text)] backdrop-blur-xl">
        {syncError && (
          <span
            role="img"
            aria-label="No se pudo sincronizar tu configuración"
            title={`No se pudo guardar/cargar tu configuración: ${syncError}`}
            className="text-red-400"
          >
            ⚠
          </span>
        )}
        <span>{user.email}</span>
        <button
          onClick={signOut}
          className="rounded-full border border-[var(--tone-housing-border)] px-3 py-1 hover:border-[var(--accent)]"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setInfo("");
    setSubmitting(true);
    try {
      if (mode === "signUp") {
        await signUp(email, password);
        setInfo("Cuenta creada. Revisa tu correo para confirmar.");
      } else {
        await signIn(email, password);
        setOpen(false);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-[var(--tone-housing-border)] bg-[var(--tone-housing-bg)] px-4 py-2 text-sm text-[var(--tone-text)] backdrop-blur-xl hover:border-[var(--accent)]"
      >
        Iniciar sesión / Crear cuenta
      </button>

      {open && (
        <form
          onSubmit={submit}
          className="absolute right-0 z-10 mt-2 flex w-64 flex-col gap-2 rounded-xl border border-[var(--tone-housing-border)] bg-[var(--tone-housing-bg)] p-4 text-[var(--tone-text)] backdrop-blur-xl"
        >
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setMode("signIn")}
              className={mode === "signIn" ? "font-bold underline" : "text-[var(--tone-text-muted)]"}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("signUp")}
              className={mode === "signUp" ? "font-bold underline" : "text-[var(--tone-text-muted)]"}
            >
              Crear cuenta
            </button>
          </div>
          <input
            type="email"
            required
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-[var(--tone-housing-border)] bg-[var(--tone-input-bg)] px-3 py-2 text-sm text-[var(--tone-input-text)] outline-none focus:border-[var(--accent)]"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--tone-housing-border)] bg-[var(--tone-input-bg)] px-3 py-2 pr-9 text-sm text-[var(--tone-input-text)] outline-none focus:border-[var(--accent)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--tone-text-muted)] hover:text-[var(--tone-text)]"
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <button
            type="submit"
            aria-busy={submitting}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold text-[#1a1006] ${
              submitting ? "cursor-wait opacity-70" : ""
            }`}
            style={{ background: "var(--accent)" }}
          >
            {submitting && (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            )}
            {submitting
              ? mode === "signUp"
                ? "Creando cuenta…"
                : "Entrando…"
              : mode === "signUp"
                ? "Crear cuenta"
                : "Entrar"}
          </button>
          {error && <p className="text-xs text-red-400">{error}</p>}
          {info && <p className="text-xs text-emerald-400">{info}</p>}
        </form>
      )}
    </div>
  );
}
