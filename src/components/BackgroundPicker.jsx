import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { DEFAULT_IMAGES } from "../lib/defaultImages";

const MAX_IMAGES_PER_USER = 10; // must match supabase/schema.sql
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // must match the bucket's file_size_limit

const GRADIENT_PRESETS = [
  ["#ff9a9e", "#fecfef"],
  ["#a1c4fd", "#c2e9fb"],
  ["#d4fc79", "#96e6a1"],
  ["#30cfd0", "#330867"],
  ["#0f2027", "#2c5364"],
];

export default function BackgroundPicker({ settings, onChange, user }) {
  const [tab, setTab] = useState(settings.backgroundType);
  const [myImages, setMyImages] = useState([]);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) {
      setMyImages([]);
      return;
    }
    supabase.storage
      .from("user-images")
      .list(user.id)
      .then(({ data }) => {
        if (!data) return;
        const urls = data.map(
          (file) =>
            supabase.storage.from("user-images").getPublicUrl(`${user.id}/${file.name}`).data
              .publicUrl,
        );
        setMyImages(urls);
      });
  }, [user]);

  const setColor = (hex) => onChange({ backgroundType: "color", backgroundValue: hex });
  const setGradient = (from, to) =>
    onChange({
      backgroundType: "gradient",
      backgroundValue: `linear-gradient(135deg, ${from}, ${to})`,
    });
  const setImage = (url) => onChange({ backgroundType: "image", backgroundValue: url });

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadError("");

    if (!user) {
      setUploadError("Crea una cuenta para subir tus propias imágenes.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setUploadError(`La imagen pesa más de ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB.`);
      return;
    }
    if (myImages.length >= MAX_IMAGES_PER_USER) {
      setUploadError(`Ya alcanzaste el límite de ${MAX_IMAGES_PER_USER} imágenes.`);
      return;
    }

    setUploading(true);
    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("user-images").upload(path, file);
    setUploading(false);

    if (error) {
      setUploadError(error.message);
      return;
    }

    const { data } = supabase.storage.from("user-images").getPublicUrl(path);
    setMyImages((prev) => [...prev, data.publicUrl]);
    setImage(data.publicUrl);
  };

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-[var(--tone-housing-border)] bg-[var(--tone-housing-bg)] p-4 text-[var(--tone-text)] backdrop-blur-xl">
      <div className="mb-3 flex flex-col items-center gap-1.5 border-b border-[var(--tone-housing-border)] pb-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--tone-text-muted)]">
          Color del contador
        </span>
        <div className="flex gap-2">
          {[
            ["auto", "Auto"],
            ["light", "Claro"],
            ["dark", "Oscuro"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => onChange({ textTone: value })}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                (settings.textTone ?? "auto") === value
                  ? "text-[#1a1006]"
                  : "border border-[var(--tone-housing-border)] hover:border-[var(--accent)]"
              }`}
              style={(settings.textTone ?? "auto") === value ? { background: "var(--accent)" } : undefined}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3 flex justify-center gap-2">
        {[
          ["color", "Color"],
          ["gradient", "Gradiente"],
          ["image", "Imagen"],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`rounded-full px-4 py-1 text-sm font-medium transition ${
              tab === value
                ? "text-[#1a1006]"
                : "border border-[var(--tone-housing-border)] hover:border-[var(--accent)]"
            }`}
            style={tab === value ? { background: "var(--accent)" } : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "color" && (
        <div className="flex items-center justify-center gap-3">
          <input
            type="color"
            value={settings.backgroundType === "color" ? settings.backgroundValue : "#1e1e2e"}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-16 cursor-pointer rounded"
          />
          <span className="text-sm text-[var(--tone-text-muted)]">Elige un color sólido</span>
        </div>
      )}

      {tab === "gradient" && (
        <div className="flex flex-wrap justify-center gap-3">
          {GRADIENT_PRESETS.map(([from, to]) => (
            <button
              key={from + to}
              onClick={() => setGradient(from, to)}
              style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
              className="h-12 w-20 rounded-lg ring-2 ring-[var(--tone-housing-border)] transition hover:ring-[var(--accent)]"
            />
          ))}
        </div>
      )}

      {tab === "image" && (
        <div className="space-y-3">
          <div>
            <p className="mb-2 text-center text-xs uppercase tracking-wide text-[var(--tone-text-muted)]">
              Pool por defecto
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {DEFAULT_IMAGES.map((url) => (
                <button key={url} onClick={() => setImage(url)} className="shrink-0">
                  <img
                    src={url}
                    alt=""
                    className="h-14 w-24 rounded-md object-cover ring-2 ring-[var(--tone-housing-border)] hover:ring-[var(--accent)]"
                  />
                </button>
              ))}
            </div>
          </div>

          {myImages.length > 0 && (
            <div>
              <p className="mb-2 text-center text-xs uppercase tracking-wide text-[var(--tone-text-muted)]">
                Mis imágenes ({myImages.length}/{MAX_IMAGES_PER_USER})
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {myImages.map((url) => (
                  <button key={url} onClick={() => setImage(url)} className="shrink-0">
                    <img
                      src={url}
                      alt=""
                      className="h-14 w-24 rounded-md object-cover ring-2 ring-[var(--tone-housing-border)] hover:ring-[var(--accent)]"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-1 pt-1">
            <label
              className="cursor-pointer rounded-full border border-[var(--tone-housing-border)] px-4 py-2 text-sm font-medium hover:border-[var(--accent)]"
            >
              {uploading ? "Subiendo..." : "Subir imagen propia"}
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleUpload} disabled={uploading} />
            </label>
            {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
            {!user && (
              <p className="text-xs text-[var(--tone-text-muted)]">Inicia sesión para guardar tus propias imágenes.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
