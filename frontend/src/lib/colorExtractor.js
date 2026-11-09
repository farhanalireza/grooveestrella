// src/lib/colorExtractor.js
/**
 * Browser-native adaptive color extractor with true atmospheric coloration
 * and guaranteed contrast protection.
 *
 * In Album-Adaptive mode, the background visibly adopts the rich, resonant colors
 * of the album cover art (deep sapphire, emerald, ruby wine, desert amber, indigo),
 * NEVER a flat pitch black!
 *
 * For light/white covers (e.g. Pink Floyd's 'Wish You Were Here' or The Beatles' 'White Album'):
 * It samples the non-white colored pixels (sky cyan, fire amber, sand terracotta)
 * and creates a rich, dark tinted background (lightness ~16%, saturation ~40%)
 * with crisp cream/white text (contrast ratio > 10:1).
 */

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
 * Relative luminance (W3C formula)
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

  // Visibly colored background (15% lightness, 45% saturation - rich and colorful!)
  const bg = hslToHex(hue, 45, 14);
  const ambientTop = hslToHex(hue, 60, 24);
  const deepBase = hslToHex(hue, 40, 9);
  const accent = hslToHex(hue, 85, 68);
  const accentBg = hslToHex(hue, 70, 52);

  const rNum = parseInt(bg.slice(1, 3), 16);
  const gNum = parseInt(bg.slice(3, 5), 16);
  const bNum = parseInt(bg.slice(5, 7), 16);

  return {
    bg,
    ambientTop,
    deepBase,
    fg: "#FFF8F0",
    accent,
    accentBg,
    accentFg: "#101116",
    surface: `rgba(${rNum + 20}, ${gNum + 20}, ${bNum + 20}, 0.55)`,
    surfaceElevated: `rgba(${rNum + 35}, ${gNum + 35}, ${bNum + 35}, 0.85)`,
    card: `rgba(${rNum + 25}, ${gNum + 25}, ${bNum + 25}, 0.65)`,
    border: "rgba(255, 248, 240, 0.16)",
    borderActive: accent,
    muted: "rgba(255, 248, 240, 0.75)",
    plum: ambientTop,
    gradient: `radial-gradient(ellipse at 50% -15%, ${ambientTop} 0%, ${bg} 65%, ${deepBase} 100%)`,
  };
}

/**
 * Main color extractor for album / artist / track cover images.
 * Returns a Promise that resolves to a rich, colorful, accessible adaptive palette.
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
          if (lum > 0.70 || l > 80) {
            whitePixelsCount++;
          }

          // Collect non-white, non-black, colored pixels for true color extraction
          if (s >= 18 && l >= 15 && l <= 85) {
            saturatedSwatches.push({ r, g, b, h, s, l });
          }
        }

        const avgR = Math.round(totalR / totalPixels);
        const avgG = Math.round(totalG / totalPixels);
        const avgB = Math.round(totalB / totalPixels);

        const isPredominantlyWhiteOrLight = (whitePixelsCount / totalPixels) > 0.35;
        const [avgH, avgS, avgL] = rgbToHsl(avgR, avgG, avgB);

        let finalHue = avgH;
        let finalSat = avgS;
        let accentColor = "#E8A87C";

        // Prioritize colorful swatches over white/gray borders
        if (saturatedSwatches.length > 0) {
          // Sort by highest saturation
          saturatedSwatches.sort((a, b) => b.s - a.s);
          const topSwatch = saturatedSwatches[0];
          finalHue = topSwatch.h;
          finalSat = Math.max(topSwatch.s, 40);
          accentColor = hslToHex(topSwatch.h, Math.min(topSwatch.s + 15, 95), 68);
        } else {
          accentColor = "#E8A87C";
        }

        let bgHex;
        let ambientTop;
        let deepBase;

        if (isPredominantlyWhiteOrLight) {
          // Artwork has a light/white background (like Wish You Were Here)
          // We use the sampled accent hue (e.g. sandy orange/fire or sky cyan)
          // to create a rich, visible warm dark background (lightness ~15-17%), NEVER pure black!
          const activeHue = saturatedSwatches.length > 0 ? finalHue : 30; // Warm amber default
          bgHex = hslToHex(activeHue, 40, 15);
          ambientTop = hslToHex(activeHue, 55, 23);
          deepBase = hslToHex(activeHue, 35, 10);
        } else {
          // Full rich colored artwork: set background lightness to 14-16% with rich saturation
          const clampedSat = Math.max(Math.min(finalSat, 55), 35);
          bgHex = hslToHex(finalHue, clampedSat, 14);
          ambientTop = hslToHex(finalHue, Math.min(clampedSat + 15, 65), 25);
          deepBase = hslToHex(finalHue, Math.min(clampedSat, 40), 9);
        }

        const accentBg = hslToHex(finalHue, Math.min(finalSat + 20, 75), 50);

        const rNum = parseInt(bgHex.slice(1, 3), 16);
        const gNum = parseInt(bgHex.slice(3, 5), 16);
        const bNum = parseInt(bgHex.slice(5, 7), 16);

        const resultPalette = {
          bg: bgHex,
          ambientTop,
          deepBase,
          fg: "#FFF8F0",
          accent: accentColor,
          accentBg,
          accentFg: "#101116",
          surface: `rgba(${rNum + 20}, ${gNum + 20}, ${bNum + 20}, 0.55)`,
          surfaceElevated: `rgba(${rNum + 35}, ${gNum + 35}, ${bNum + 35}, 0.85)`,
          card: `rgba(${rNum + 25}, ${gNum + 25}, ${bNum + 25}, 0.65)`,
          border: "rgba(255, 248, 240, 0.16)",
          borderActive: accentColor,
          muted: "rgba(255, 248, 240, 0.75)",
          plum: ambientTop,
          gradient: `radial-gradient(ellipse at 50% -15%, ${ambientTop} 0%, ${bgHex} 65%, ${deepBase} 100%)`,
        };

        paletteCache.set(imageUrl, resultPalette);
        resolve(resultPalette);
      } catch (err) {
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
