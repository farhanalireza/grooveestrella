// src/lib/colorExtractor.js
/**
 * Browser-native adaptive color extractor with guaranteed contrast protection.
 * Extracts dominant tones from an image URL and produces an accessible,
 * atmospheric dark palette.
 *
 * CRITICAL CONTRAST PROTECTION:
 * Regardless of whether the album cover is 100% white (e.g. Pink Floyd's 'Wish You Were Here'
 * or The Beatles' 'White Album') or pastel, the background luminance is strictly clamped
 * to deep obsidian/midnight tones (lightness <= 9%) and the text is locked to high-contrast
 * warm cream/white.
 */

// In-memory cache to avoid re-extracting for the same cover URL
const paletteCache = new Map();

/**
 * Converts RGB to HSL
 */
function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * Converts HSL to RGB hex string
 */
function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

/**
 * Calculate relative luminance (W3C formula)
 */
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Fast deterministic fallback palette derived from title/string hash
 */
export function getHarmoniousFallback(seedString = "groove") {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;

  // Deep dark background with subtle tint of the hue
  const bg = hslToHex(hue, 35, 6); // 6% lightness
  const accent = hslToHex(hue, 75, 65); // vibrant readable accent
  const accentBg = hslToHex(hue, 65, 52);

  return {
    bg,
    fg: "#FFF5EA",
    accent,
    accentBg,
    accentFg: "#101116",
    surface: `rgba(${parseInt(bg.slice(1,3), 16)}, ${parseInt(bg.slice(3,5), 16)}, ${parseInt(bg.slice(5,7), 16)}, 0.45)`,
    surfaceElevated: `rgba(${parseInt(bg.slice(1,3), 16)}, ${parseInt(bg.slice(3,5), 16)}, ${parseInt(bg.slice(5,7), 16)}, 0.75)`,
    card: `rgba(${parseInt(bg.slice(1,3), 16)}, ${parseInt(bg.slice(3,5), 16)}, ${parseInt(bg.slice(5,7), 16)}, 0.55)`,
    border: "rgba(255, 245, 234, 0.14)",
    borderActive: accent,
    muted: "rgba(255, 245, 234, 0.72)",
    plum: bg,
    gradient: `linear-gradient(135deg, ${bg} 0%, ${accentBg} 50%, #FFEDD5 100%)`,
  };
}

/**
 * Main color extractor for album / artist / track cover images.
 * Returns a Promise that resolves to an accessible, atmospheric dark palette.
 */
export async function extractAdaptivePalette(imageUrl, fallbackTitle = "groove") {
  if (!imageUrl) {
    return getHarmoniousFallback(fallbackTitle);
  }

  if (paletteCache.has(imageUrl)) {
    return paletteCache.get(imageUrl);
  }

  if (typeof window === "undefined") {
    return getHarmoniousFallback(fallbackTitle);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    const timeout = setTimeout(() => {
      const fallback = getHarmoniousFallback(fallbackTitle);
      paletteCache.set(imageUrl, fallback);
      resolve(fallback);
    }, 1800);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        
        // Downscale to 32x32 for ultra-fast sampling
        canvas.width = 32;
        canvas.height = 32;
        ctx.drawImage(img, 0, 0, 32, 32);

        const imgData = ctx.getImageData(0, 0, 32, 32).data;
        const totalPixels = 32 * 32;

        let totalR = 0, totalG = 0, totalB = 0;
        let whitePixelsCount = 0;
        let saturatedSwatches = [];

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (a < 128) continue; // Skip transparent

          totalR += r;
          totalG += g;
          totalB += b;

          const lum = getLuminance(r, g, b);
          const [h, s, l] = rgbToHsl(r, g, b);

          // Track white or near-white pixels (e.g. Wish You Were Here album border)
          if (lum > 0.75 || l > 85) {
            whitePixelsCount++;
          }

          // Collect saturated colorful pixels for accent selection
          if (s > 25 && l > 20 && l < 85) {
            saturatedSwatches.push({ r, g, b, h, s, l });
          }
        }

        const avgR = Math.round(totalR / totalPixels);
        const avgG = Math.round(totalG / totalPixels);
        const avgB = Math.round(totalB / totalPixels);

        const isPredominantlyWhiteOrLight = (whitePixelsCount / totalPixels) > 0.40;
        const [avgH, avgS, avgL] = rgbToHsl(avgR, avgG, avgB);

        let finalHue = avgH;
        let accentColor = "#E8A87C";

        // Pick most vibrant swatch for accent
        if (saturatedSwatches.length > 0) {
          // Sort by highest saturation
          saturatedSwatches.sort((a, b) => b.s - a.s);
          const best = saturatedSwatches[0];
          finalHue = best.h;
          // Ensure accent has good contrast on dark background
          accentColor = hslToHex(best.h, Math.min(best.s + 15, 90), 65);
        } else {
          accentColor = "#E8A87C"; // Default warm golden copper
        }

        // CONTRAST SAFEGUARD:
        // Clamping background lightness to deep obsidian/midnight (6% - 8% lightness)
        // If the cover is predominantly white, use a subtle deep charcoal-slate (#0d0f14)
        // so white covers NEVER wash out text or background!
        let bgHex;
        if (isPredominantlyWhiteOrLight || avgS < 12) {
          bgHex = "#0e1017"; // Ultra-deep obsidian slate with pristine contrast
        } else {
          // Deep atmospheric dark tone carrying the album's dominant hue
          bgHex = hslToHex(finalHue, Math.min(avgS, 45), 7);
        }

        const accentBg = hslToHex(finalHue, Math.min(avgS + 20, 75), 45);

        const rNum = parseInt(bgHex.slice(1, 3), 16);
        const gNum = parseInt(bgHex.slice(3, 5), 16);
        const bNum = parseInt(bgHex.slice(5, 7), 16);

        const resultPalette = {
          bg: bgHex,
          fg: "#FFF5EA",
          accent: accentColor,
          accentBg,
          accentFg: "#101116",
          surface: `rgba(${rNum + 15}, ${gNum + 15}, ${bNum + 15}, 0.55)`,
          surfaceElevated: `rgba(${rNum + 25}, ${gNum + 25}, ${bNum + 25}, 0.85)`,
          card: `rgba(${rNum + 20}, ${gNum + 20}, ${bNum + 20}, 0.65)`,
          border: "rgba(255, 245, 234, 0.16)",
          borderActive: accentColor,
          muted: "rgba(255, 245, 234, 0.72)",
          plum: bgHex,
          gradient: `linear-gradient(135deg, ${bgHex} 0%, ${accentBg} 50%, #FFEDD5 100%)`,
        };

        paletteCache.set(imageUrl, resultPalette);
        resolve(resultPalette);
      } catch (err) {
        // In case of CORS or canvas security violation, return harmonious fallback
        const fallback = getHarmoniousFallback(fallbackTitle);
        paletteCache.set(imageUrl, fallback);
        resolve(fallback);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      const fallback = getHarmoniousFallback(fallbackTitle);
      paletteCache.set(imageUrl, fallback);
      resolve(fallback);
    };

    img.src = imageUrl;
  });
}
