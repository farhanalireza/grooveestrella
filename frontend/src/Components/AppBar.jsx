// src/Components/AppBar.jsx
"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  ListMusic,
  Music,
  Cog,
  Newspaper,
  UserRound,
  Sun,
  Moon,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

const AppBar = ({ selectedSection, setSection }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();

  // Set section based on route path
  useEffect(() => {
    const path = pathname || "";

    if (path === "/") setSection("Music");
    else if (path.startsWith("/search")) setSection("Search");
    else if (path.startsWith("/account")) setSection("Account");
    else if (path.startsWith("/feedback")) setSection("Review");
    else if (path.startsWith("/settings")) setSection("Settings");
    else if (path.startsWith("/library")) setSection("Playlist");
    else setSection("");
  }, [pathname, setSection]);

  const navItems = [
    {
      label: "Music",
      icon: <Music size={18} />, 
      section: "Music",
      route: "/"
    },
    {
      label: "Explore",
      icon: <Search size={18} />, 
      section: "Search",
      route: "/search"
    },
    {
      label: "Account",
      icon: <UserRound size={18} />, 
      section: "Account",
      route: "/account"
    },
    {
      label: "Library",
      icon: <ListMusic size={18} />, 
      section: "Playlist",
      route: "/library"
    },
    {
      label: "Settings",
      icon: <Cog size={18} />, 
      section: "Settings",
      route: "/settings"
    },
    {
      label: "Review",
      icon: <Newspaper size={18} />, 
      section: "Review",
      route: "/feedback"
    }
  ];

  const mobileNavItems = [
    {
      label: "Music",
      icon: <Music size={18} />, 
      section: "Music",
      route: "/"
    },
    {
      label: "Explore",
      icon: <Search size={18} />, 
      section: "Search",
      route: "/search"
    },
    {
      label: "Account",
      icon: <UserRound size={18} />, 
      section: "Account",
      route: "/account"
    },
    {
      label: "Library",
      icon: <ListMusic size={18} />, 
      section: "Playlist",
      route: "/library"
    },
    {
      label: "Settings",
      icon: <Cog size={18} />, 
      section: "Settings",
      route: "/settings"
    }
  ];

  const handleNavClick = (item) => {
    setSection(item.section);
    router.push(item.route);
  };

  const isDetailPage = pathname?.startsWith("/track/") || pathname?.startsWith("/album/") || pathname?.startsWith("/artist/") || pathname?.startsWith("/playlist/");
  const isSharePage = pathname?.startsWith("/s/");
  const brandName = isSharePage ? "GrooveLink" : "GrooveEstrella";

  return (
    <>
      {/* Desktop Top Header Navigation Bar */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 bg-[var(--theme-surface-elevated)] backdrop-blur-md border-b border-[var(--theme-border)] z-[400] h-16 transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-full">
          
          {/* Logo & Brand Name */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition duration-200" 
            onClick={() => router.push("/")}
          >
            <img src="/in.svg" alt={brandName} className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold text-[var(--theme-fg)] tracking-tight font-display">{brandName}</span>
          </div>

          {/* Desktop Nav Items & Theme Toggle */}
          <div className="flex items-center gap-3">
            <nav className="flex items-center gap-2">
              {navItems.map((item, idx) => {
                const isActive = selectedSection === item.section;
                return (
                  <button
                    key={idx}
                    onClick={() => handleNavClick(item)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-4xl transition-all duration-300 border cursor-pointer ${
                      isActive
                        ? "bg-[var(--theme-card)] text-[var(--theme-fg)] border-[var(--theme-border-active)] shadow-md shadow-[var(--theme-bg)]/20"
                        : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:bg-[var(--theme-surface)] border-transparent"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Desktop GrooveLink trigger on detail pages */}
            {isDetailPage && (
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-groovelink'));
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-[var(--theme-border)] bg-[var(--theme-card)] hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)] text-[var(--theme-fg)] text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
                title="Open GrooveLink Modal"
              >
                <img src="/in.svg" alt="GrooveLink" className="w-4 h-4 object-contain" />
                <span>GrooveLink</span>
              </button>
            )}

            {/* Desktop Theme Switcher Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-full border border-[var(--theme-border)] bg-[var(--theme-card)] text-[var(--theme-fg)] hover:border-[var(--theme-accent)] transition-all duration-300 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
              title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={16} className="text-[var(--theme-accent)]" /> : <Moon size={16} className="text-[var(--theme-accent)]" />}
            </button>
          </div>

        </div>
      </div>

      {/* Floating Mobile Bottom Navigation Bar with Liquid Glass & Fluid Animations */}
      <div className="lg:hidden fixed bottom-4 inset-x-4 max-w-md mx-auto z-[350]">
        <nav className="relative px-2 py-1.5 rounded-4xl bg-[var(--theme-surface-elevated)] backdrop-blur-2xl border border-[var(--theme-border)] shadow-2xl flex justify-around items-center select-none overflow-hidden transition-colors duration-300">
          {/* Liquid Glass Top Reflection */}
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--theme-accent)]/30 to-transparent pointer-events-none" />

          {mobileNavItems.map((item, idx) => {
            const isActive = selectedSection === item.section;
            return (
              <motion.button
                key={idx}
                whileTap={{ scale: 0.92 }}
                onClick={() => handleNavClick(item)}
                className="relative flex-1 py-1.5 px-1 flex flex-col justify-center items-center gap-1 transition-colors duration-200 cursor-pointer"
              >
                {/* Fluid Liquid Active Pill */}
                {isActive && (
                  <motion.div
                    layoutId="mobileNavActivePill"
                    transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    className="absolute inset-1 rounded-4xl bg-[var(--theme-accent-bg)]/25 border border-[var(--theme-border-active)] shadow-sm -z-0 w-full h-full top-0 left-0"
                  />
                )}

                {/* Animated Icon */}
                <motion.div
                  animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className={`relative z-10 transition-colors duration-200 ${
                    isActive ? "text-[var(--theme-accent)]" : "text-[var(--theme-muted)]"
                  }`}
                >
                  {item.icon}
                </motion.div>

                {/* Text Label */}
                <span className={`relative z-10 text-[9px] font-bold tracking-wider uppercase leading-none transition-colors duration-200 ${
                  isActive ? "text-[var(--theme-fg)] font-black" : "text-[var(--theme-muted)] font-semibold"
                }`}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}

          {/* Mobile Theme Toggle Button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={toggleTheme}
            className="relative py-1.5 px-2 flex flex-col justify-center items-center gap-1 text-[var(--theme-muted)] hover:text-[var(--theme-fg)] transition-colors duration-200 cursor-pointer"
            title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
            aria-label="Toggle Theme"
          >
            <div className="relative z-10">
              {isDark ? <Sun size={17} className="text-[var(--theme-accent)]" /> : <Moon size={17} className="text-[var(--theme-accent)]" />}
            </div>
            <span className="relative z-10 text-[9px] font-bold tracking-wider uppercase leading-none">
              {isDark ? "Light" : "Dark"}
            </span>
          </motion.button>
        </nav>
      </div>
    </>
  );
};

export default AppBar;