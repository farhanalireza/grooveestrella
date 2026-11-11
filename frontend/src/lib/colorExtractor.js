// src/lib/colorExtractor.js
/**
 * Browser-native adaptive color extractor with multi-bin hue clustering,
 * true atmospheric coloration, dynamic accent vibrance, and guaranteed contrast.
 *
 * In Album-Adaptive mode, the background dynamically adopts the dominant rich hue
 * of the album cover art (deep sapphire, emerald pine, ruby wine, desert amber,
 * warm terracotta, electric cyan, royal blue, etc.), NEVER defaulting to purple!
 */

const paletteCache = new Map();

/**
 * Converts RGB to HSL [0-360, 0-100, 0-100]
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
 * Converts HSL to RGB hex string (#RRGGBB)
 */
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;
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
 * Vibrant and varied color wheel fallback for when cover image is unavailable or blocked.
 * Produces diverse, distinct color identities (terracotta, oceanic teal, emerald, gold, indigo, crimson)
 * rather than hardcoded purple.
 */
const VIBRANT_COLOR_FAMILIES = [
  { name: "Oceanic Azure", hue: 205, accentHue: 190 },
  { name: "Amber Gold", hue: 38, accentHue: 44 },
  { name: "Emerald Forest", hue: 155, accentHue: 145 },
  { name: "Sunset Terracotta", hue: 18, accentHue: 28 },
  { name: "Crimson Velvet", hue: 350, accentHue: 12 },
  { name: "Midnight Cobalt", hue: 225, accentHue: 210 },
  { name: "Electric Cyan", hue: 180, accentHue: 175 },
  { name: "Neon Lime", hue: 85, accentHue: 75 },
  { name: "Warm Bronze", hue: 28, accentHue: 36 },
  { name: "Deep Indigo", hue: 245, accentHue: 255 },
  { name: "Wildberry Plum", hue: 320, accentHue: 335 },
  { name: "Nordic Slate", hue: 210, accentHue: 195 },
];

export function getHarmoniousFallback(seedString = "groove") {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % VIBRANT_COLOR_FAMILIES.length;
  const family = VIBRANT_COLOR_FAMILIES[index];
  const hue = family.hue;
  const accentHue = family.accentHue;

  const bg = hslToHex(hue, 38, 12);
  const ambientTop = hslToHex(hue, 55, 22);
  const deepBase = hslToHex(hue, 32, 8);
  const accent = hslToHex(accentHue, 88, 64);
  const accentBg = hslToHex(accentHue, 75, 48);

  const rNum = parseInt(bg.slice(1, 3), 16);
  const gNum = parseInt(bg.slice(3, 5), 16);
  const bNum = parseInt(bg.slice(5, 7), 16);

  return {
    bg,
    ambientTop,
    deepBase,
    fg: "#FFFDF9",
    accent,
    accentBg,
    accentFg: "#0F1115",
    surface: `rgba(${rNum + 24}, ${gNum + 24}, ${bNum + 24}, 0.60)`,
    surfaceElevated: `rgba(${rNum + 38}, ${gNum + 38}, ${bNum + 38}, 0.88)`,
    card: `rgba(${rNum + 28}, ${gNum + 28}, ${bNum + 28}, 0.68)`,
    border: "rgba(255, 253, 249, 0.14)",
    borderActive: accent,
    muted: "rgba(255, 253, 249, 0.72)",
    plum: ambientTop,
    gradient: `radial-gradient(ellipse at 50% -10%, ${ambientTop} 0%, ${bg} 62%, ${deepBase} 100%)`,
  };
}

/**
 * 24-Bin Hue Clustering with Perceptual Weighting.
 * Identifies the authentic artistic dominant color and vibrant accents from cover artwork.
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
    }, 6500);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("Could not get 2d context");

        // Downsample to 48x48 for balanced speed and color accuracy
        const sampleSize = 48;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

        const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
        const totalPixels = sampleSize * sampleSize;

        // 24 Hue Bins (15 degrees each)
        const BIN_COUNT = 24;
        const bins = Array.from({ length: BIN_COUNT }, () => ({
          count: 0,
          totalS: 0,
          totalL: 0,
          totalR: 0,
          totalG: 0,
          totalB: 0,
          maxSat: 0,
          vividSample: null,
        }));

        let validColoredPixels = 0;
        let whitePixelsCount = 0;
        let blackPixelsCount = 0;
        let mostVibrantPixel = null;
        let maxVibrancyScore = -1;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (a < 128) continue; // Skip transparency

          const lum = getLuminance(r, g, b);
          const [h, s, l] = rgbToHsl(r, g, b);

          if (lum > 0.85 || l > 90) {
            whitePixelsCount++;
            continue;
          }
          if (lum < 0.05 || l < 8) {
            blackPixelsCount++;
            continue;
          }

          // We count pixels with noticeable saturation as candidates for color theme
          if (s >= 14 && l >= 10 && l <= 90) {
            validColoredPixels++;

            const binIndex = Math.min(Math.floor(h / (360 / BIN_COUNT)), BIN_COUNT - 1);
            const bin = bins[binIndex];
            bin.count++;
            bin.totalS += s;
            bin.totalL += l;
            bin.totalR += r;
            bin.totalG += g;
            bin.totalB += b;

            if (s > bin.maxSat) {
              bin.maxSat = s;
              bin.vividSample = { r, g, b, h, s, l };
            }

            // Vibrancy scoring: high saturation, medium-light luminance, avoids pure black or white
            const vibrancyScore = (s * 1.5) * (1 - Math.abs(l - 55) / 55);
            if (vibrancyScore > maxVibrancyScore) {
              maxVibrancyScore = vibrancyScore;
              mostVibrantPixel = { r, g, b, h, s, l };
            }
          }
        }

        // Check if artwork is predominantly achromatic (B&W or monochrome)
        const isMonochrome = validColoredPixels < totalPixels * 0.06;

        let dominantHue = 210;
        let dominantSat = 40;
        let dominantLight = 22;
        let accentHue = 40;
        let accentSat = 85;
        let accentLight = 72;

        if (!isMonochrome) {
          // Score each bin: pixelCount * (avgSat^1.2) * lightness balance
          let bestBinIndex = -1;
          let highestScore = -1;

          bins.forEach((bin, idx) => {
            if (bin.count === 0) return;
            const avgS = bin.totalS / bin.count;
            const avgL = bin.totalL / bin.count;
            const lightnessFactor = 1 - Math.abs(avgL - 50) / 75;
            const score = bin.count * Math.pow(avgS, 1.25) * Math.max(0.2, lightnessFactor);

            if (score > highestScore) {
              highestScore = score;
              bestBinIndex = idx;
            }
          });

          if (bestBinIndex >= 0) {
            const bestBin = bins[bestBinIndex];
            const avgR = Math.round(bestBin.totalR / bestBin.count);
            const avgG = Math.round(bestBin.totalG / bestBin.count);
            const avgB = Math.round(bestBin.totalB / bestBin.count);
            const [binH, binS, binL] = rgbToHsl(avgR, avgG, avgB);

            dominantHue = binH;

            // Focus FIRST on preserving the authentic primary cover color for the background:
            // Preserve genuine light-pastel covers (e.g. bright cream/pastel covers) vs vibrant saturated covers (e.g. MBDTF crimson)
            if (binL >= 76 && whitePixelsCount > totalPixels * 0.45) {
              dominantSat = Math.min(binS, 42);
              dominantLight = Math.min(88, Math.max(76, binL));
            } else {
              dominantSat = binS >= 42 ? Math.min(86, Math.max(58, binS)) : Math.max(24, binS);
              dominantLight = Math.max(20, Math.min(31, Math.round(binL * 0.56)));
            }

            // Select vibrant contrasting accent
            if (mostVibrantPixel && mostVibrantPixel.s >= 40) {
              accentHue = mostVibrantPixel.h;
              accentSat = Math.max(mostVibrantPixel.s, 78);
              accentLight = Math.max(66, Math.min(78, mostVibrantPixel.l));
            } else {
              accentHue = (dominantHue + 35) % 360;
              accentSat = 85;
              accentLight = 72;
            }
          }
        } else {
          // Monochrome / Black & White / White Album cover:
          if (whitePixelsCount > totalPixels * 0.62) {
            dominantHue = 40;
            dominantSat = 12;
            dominantLight = 88;
            accentHue = 220;
            accentSat = 65;
            accentLight = 38;
          } else {
            dominantHue = 220;
            dominantSat = 16;
            dominantLight = 13;
            accentHue = 42;
            accentSat = 88;
            accentLight = 70;
          }
        }

        // 1. Primary Background Color FIRST (authentic Apple Music style rich cover hue, never washed-out 11% mud)
        const bgHex = hslToHex(dominantHue, dominantSat, dominantLight);
        const rNum = parseInt(bgHex.slice(1, 3), 16);
        const gNum = parseInt(bgHex.slice(3, 5), 16);
        const bNum = parseInt(bgHex.slice(5, 7), 16);
        const bgLum = getLuminance(rNum, gNum, bNum);
        const isLightBg = bgLum > 0.34;

        const ambientTop = isLightBg
          ? hslToHex(dominantHue, Math.min(dominantSat + 10, 50), Math.min(94, dominantLight + 5))
          : hslToHex(dominantHue, Math.min(dominantSat + 8, 90), Math.min(38, dominantLight + 9));
        const deepBase = bgHex;

        // 2. Foreground & Surfaces SECOND — derived purely for optimal contrast against bgHex
        const fg = isLightBg ? "#110D14" : "#FFFFFF";
        const muted = isLightBg ? "rgba(17, 13, 20, 0.72)" : "rgba(255, 255, 255, 0.74)";
        const surface = isLightBg ? "rgba(17, 13, 20, 0.08)" : "rgba(255, 255, 255, 0.11)";
        const card = isLightBg ? "rgba(17, 13, 20, 0.06)" : "rgba(255, 255, 255, 0.09)";
        const border = isLightBg ? "rgba(17, 13, 20, 0.14)" : "rgba(255, 255, 255, 0.15)";
        const surfaceElevated = isLightBg
          ? "rgba(255, 255, 255, 0.88)"
          : `rgba(${Math.max(0, rNum - 14)}, ${Math.max(0, gNum - 14)}, ${Math.max(0, bNum - 14)}, 0.90)`;

        const accentColor = isLightBg
          ? hslToHex(accentHue, Math.max(accentSat, 72), 34)
          : hslToHex(accentHue, Math.max(accentSat, 75), Math.max(70, accentLight));
        const accentBg = accentColor;
        const accentFg = isLightBg ? "#FFFFFF" : "#110D14";

        const resultPalette = {
          bg: bgHex,
          ambientTop,
          deepBase,
          isLightBg,
          fg,
          accent: accentColor,
          accentBg,
          accentFg,
          surface,
          surfaceElevated,
          card,
          border,
          borderActive: accentColor,
          muted,
          plum: ambientTop,
          gradient: `linear-gradient(180deg, ${ambientTop} 0%, ${bgHex} 38%, ${bgHex} 100%)`,
        };

        paletteCache.set(imageUrl, resultPalette);
        resolve(resultPalette);
      } catch (_) {
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

    // Use our local cover-proxy for external images to guarantee CORS-compliant canvas reads!
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      img.src = `/api/cover-proxy?url=${encodeURIComponent(imageUrl)}`;
    } else {
      img.src = imageUrl;
    }
  });
}
