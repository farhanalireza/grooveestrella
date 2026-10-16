// src/contexts/ThemeContext.jsx
"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

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
  theme: "dark",
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
  colors: THEME_CONFIG.dark,
  palette: THEME_PALETTE,
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("groove_theme");
      if (stored === "light" || stored === "dark") {
        setThemeState(stored);
        applyThemeToDOM(stored);
      } else {
        applyThemeToDOM("dark");
      }
    } catch (_) {
      applyThemeToDOM("dark");
    }
    setMounted(true);
  }, []);

  const applyThemeToDOM = (newTheme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("data-theme", newTheme);
    if (newTheme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute("content", newTheme === "dark" ? "#17020B" : "#FAF4EB");
    }
  };

  const setTheme = (newTheme) => {
    const validTheme = newTheme === "light" ? "light" : "dark";
    setThemeState(validTheme);
    applyThemeToDOM(validTheme);
    try {
      localStorage.setItem("groove_theme", validTheme);
    } catch (_) {}
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  const isDark = theme === "dark";
  const colors = THEME_CONFIG[theme] || THEME_CONFIG.dark;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark,
        toggleTheme,
        setTheme,
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
