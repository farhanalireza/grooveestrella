// src/contexts/ThemeContext.jsx
"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const THEME_PALETTE = {
  plum: "#470B24",
  accent: "#E8A87C",
  periwinkle: "#E8A87C",
  peach: "#FFEDD5",
  gradient: ["#470B24", "#E8A87C", "#FFEDD5"],
};

const THEME_CONFIG = {
  dark: {
    bg: "#17020B",
    fg: "#FFF2DF",
    accent: "#E8A87C",
    accentBg: "#D4A373",
    accentFg: "#17020B",
    surface: "rgba(71, 11, 36, 0.45)",
    surfaceElevated: "rgba(71, 11, 36, 0.75)",
    card: "rgba(71, 11, 36, 0.55)",
    border: "rgba(181, 150, 130, 0.18)",
    borderActive: "#E8A87C",
    muted: "rgba(255, 242, 223, 0.7)",
    plum: "#470B24",
    gradient: "linear-gradient(135deg, #470B24 0%, #D4A373 50%, #FFEDD5 100%)",
  },
  light: {
    bg: "#FAF4EB",
    fg: "#1A0A10",
    accent: "#9A4A2F",
    accentBg: "#E8C4A0",
    accentFg: "#1A0A10",
    surface: "rgba(255, 245, 235, 0.92)",
    surfaceElevated: "#FFF7ED",
    card: "#FFFFFF",
    border: "rgba(71, 11, 36, 0.12)",
    borderActive: "#9A4A2F",
    muted: "#6B3040",
    plum: "#470B24",
    gradient: "linear-gradient(135deg, #FFEDD5 0%, #D4A373 50%, #470B24 100%)",
  },
};

const ThemeContext = createContext({
  theme: "dark", // "dark" | "light" | "adaptive"
  isDark: true,
  isAdaptive: false,
  toggleTheme: () => {},
  setTheme: () => {},
  setAdaptivePalette: () => {},
  clearAdaptivePalette: () => {},
  adaptivePalette: null,
  colors: THEME_CONFIG.dark,
  palette: THEME_PALETTE,
  mounted: false,
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("dark");
  const [adaptivePalette, setAdaptivePaletteState] = useState(null);
  const [mounted, setMounted] = useState(false);

  const applyCustomVarsToDOM = useCallback((palette) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;

    if (!palette) {
      // Remove inline style overrides so data-theme CSS takes over
      const keys = [
        "--theme-bg", "--theme-fg", "--theme-accent", "--theme-accent-bg",
        "--theme-accent-fg", "--theme-surface", "--theme-surface-elevated",
        "--theme-card", "--theme-border", "--theme-border-active",
        "--theme-muted", "--theme-plum", "--theme-gradient",
        "--background", "--foreground"
      ];
      keys.forEach((k) => root.style.removeProperty(k));
      return;
    }

    // Apply adaptive palette variables
    root.style.setProperty("--theme-bg", palette.bg);
    root.style.setProperty("--background", palette.bg);
    root.style.setProperty("--theme-fg", palette.fg);
    root.style.setProperty("--foreground", palette.fg);
    root.style.setProperty("--theme-accent", palette.accent);
    root.style.setProperty("--theme-accent-bg", palette.accentBg);
    root.style.setProperty("--theme-accent-fg", palette.accentFg);
    root.style.setProperty("--theme-surface", palette.surface);
    root.style.setProperty("--theme-surface-elevated", palette.surfaceElevated);
    root.style.setProperty("--theme-card", palette.card);
    root.style.setProperty("--theme-border", palette.border);
    root.style.setProperty("--theme-border-active", palette.borderActive || palette.accent);
    root.style.setProperty("--theme-muted", palette.muted);
    root.style.setProperty("--theme-plum", palette.plum || palette.bg);
    if (palette.gradient) {
      root.style.setProperty("--theme-gradient", palette.gradient);
    }
  }, []);

  const applyThemeToDOM = useCallback((newTheme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("data-theme", newTheme === "light" ? "light" : "dark");
    
    if (newTheme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute(
        "content",
        newTheme === "light" ? "#FAF4EB" : "#17020B"
      );
    }
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("groove_theme");
      if (stored === "light" || stored === "dark" || stored === "adaptive") {
        setThemeState(stored);
        applyThemeToDOM(stored);
      } else {
        applyThemeToDOM("dark");
      }
    } catch (_) {
      applyThemeToDOM("dark");
    }
    setMounted(true);
  }, [applyThemeToDOM]);

  const setTheme = (newTheme) => {
    const validTheme = ["dark", "light", "adaptive"].includes(newTheme) ? newTheme : "dark";
    setThemeState(validTheme);
    applyThemeToDOM(validTheme);

    // If switching away from adaptive, clear any active palette
    if (validTheme !== "adaptive") {
      setAdaptivePaletteState(null);
      applyCustomVarsToDOM(null);
    }

    try {
      localStorage.setItem("groove_theme", validTheme);
    } catch (_) {}
  };

  const setAdaptivePalette = useCallback((palette) => {
    if (theme !== "adaptive") return;
    setAdaptivePaletteState(palette);
    applyCustomVarsToDOM(palette);
  }, [theme, applyCustomVarsToDOM]);

  const clearAdaptivePalette = useCallback(() => {
    setAdaptivePaletteState(null);
    applyCustomVarsToDOM(null);
  }, [applyCustomVarsToDOM]);

  const toggleTheme = () => {
    let nextTheme;
    if (theme === "dark") nextTheme = "light";
    else if (theme === "light") nextTheme = "adaptive";
    else nextTheme = "dark";
    setTheme(nextTheme);
  };

  const isDark = theme !== "light"; // adaptive defaults to dark mode
  const isAdaptive = theme === "adaptive";
  const colors = (theme === "adaptive" && adaptivePalette)
    ? adaptivePalette
    : (THEME_CONFIG[theme] || THEME_CONFIG.dark);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        isAdaptive,
        toggleTheme,
        setTheme,
        setAdaptivePalette,
        clearAdaptivePalette,
        adaptivePalette,
        colors,
        palette: THEME_PALETTE,
        mounted,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
export default ThemeContext;
