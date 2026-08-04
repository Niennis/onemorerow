// Auto-loads every image from src/assets/img/ as the curated default pool —
// drop files in that folder (or remove them) and this list updates itself.
const modules = import.meta.glob("../assets/img/*.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
});

export const DEFAULT_IMAGES = Object.values(modules);
