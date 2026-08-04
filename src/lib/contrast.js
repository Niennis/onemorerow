const HEX_RE = /#(?:[0-9a-f]{3}){1,2}\b/gi;

function hexToRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const num = parseInt(h, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

// Perceptual luminance (0 = black, 1 = white) — good enough to pick a
// legible glass tone, not a WCAG contrast-ratio calculation.
function luminance({ r, g, b }) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function luminanceOfHex(hex) {
  return luminance(hexToRgb(hex));
}

export function luminanceOfGradient(css) {
  const hexes = css.match(HEX_RE);
  if (!hexes || hexes.length === 0) return 0.5;
  const avg = hexes.reduce((sum, hex) => sum + luminanceOfHex(hex), 0) / hexes.length;
  return avg;
}

const LIGHT_THRESHOLD = 0.55;

export function toneFromLuminance(lum) {
  return lum > LIGHT_THRESHOLD ? "light" : "dark";
}

// Only the center of the image sits behind the dial, so sampling the whole
// photo's average can be wrong (e.g. a bright sky with a dark patch right
// where the numbers are). Crop to the centered square the dial occupies.
const CENTER_CROP_FRACTION = 0.5;

export function sampleImageLuminance(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const size = 16;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");

        const cropW = img.naturalWidth * CENTER_CROP_FRACTION;
        const cropH = img.naturalHeight * CENTER_CROP_FRACTION;
        const sx = (img.naturalWidth - cropW) / 2;
        const sy = (img.naturalHeight - cropH) / 2;

        ctx.drawImage(img, sx, sy, cropW, cropH, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let total = 0;
        for (let i = 0; i < data.length; i += 4) {
          total += luminance({ r: data[i], g: data[i + 1], b: data[i + 2] });
        }
        resolve(total / (data.length / 4));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}
