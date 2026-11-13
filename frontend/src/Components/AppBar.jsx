// src/Components/AppBar.jsx
"use client";

import { useEffect, useMemo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ListMusic,
  Music,
  Cog,
  Newspaper,
  UserRound,
  Sun,
  Moon,
  Sparkles,
  ListOrdered,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

const NAV_ITEMS = [
  {
    label: "Music",
    icon: <Music size={18} />,
    section: "Music",
    route: "/",
  },
  {
    label: "Explore",
    icon: <Search size={18} />,
    section: "Search",
    route: "/search",
  },
  {
    label: "Lists",
    icon: <ListOrdered size={18} />,
    section: "Lists",
    route: "/lists",
  },
  {
    label: "Library",
    icon: <ListMusic size={18} />,
    section: "Playlist",
    route: "/library",
  },
  {
    label: "Account",
    icon: <UserRound size={18} />,
    section: "Account",
    route: "/account",
  },
  {
    label: "Settings",
    icon: <Cog size={18} />,
    section: "Settings",
    route: "/settings",
  },
  {
    label: "Review",
    icon: <Newspaper size={18} />,
    section: "Review",
    route: "/feedback",
  },
];

// Mobile App Bar (left -> right): 1. Music, 2. Explore, 3. Account (center), 4. Library, 5. Settings
const MOBILE_NAV_ITEMS = [
  NAV_ITEMS.find((i) => i.label === "Music"),
  NAV_ITEMS.find((i) => i.label === "Explore"),
  NAV_ITEMS.find((i) => i.label === "Account"),
  NAV_ITEMS.find((i) => i.label === "Library"),
  NAV_ITEMS.find((i) => i.label === "Settings"),
].filter(Boolean);

const AppBar = ({ 
  selectedSection, 
  setSection, 
  isCollapsed = false, 
  onToggleSidebar 
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, isDark, toggleTheme } = useTheme();

  // Instant route-to-section resolution without waiting for useEffect
  const activeSection = useMemo(() => {
    const path = pathname || "";
    if (path === "/") return "Music";
    if (path.startsWith("/search")) return "Search";
    if (path.startsWith("/lists")) return "Lists";
    if (path.startsWith("/account") || path.startsWith("/profile")) return "Account";
    if (path.startsWith("/feedback")) return "Review";
    if (path.startsWith("/settings")) return "Settings";
    if (path.startsWith("/library") || path.startsWith("/journal")) return "Playlist";
    return selectedSection || "";
  }, [pathname, selectedSection]);

  // Keep parent in sync if setSection is provided
  useEffect(() => {
    if (setSection && activeSection && selectedSection !== activeSection) {
      setSection(activeSection);
    }
  }, [activeSection, selectedSection, setSection]);

  const handlePrefetch = useCallback((route) => {
    try {
      router.prefetch(route);
    } catch (_) {}
  }, [router]);

  const isDetailPage = pathname?.startsWith("/track/") || pathname?.startsWith("/album/") || pathname?.startsWith("/artist/") || pathname?.startsWith("/playlist/");
  const isSharePage = pathname?.startsWith("/s/");
  const brandName = isSharePage ? "GrooveLink" : "GrooveEstrella";

  return (
    <>
      {/* Desktop PC Side Navigation Bar with Collapsible Toggle (Cleared Top Header) */}
      <aside 
        className={`hidden lg:flex fixed top-0 bottom-0 left-0 bg-[var(--theme-surface-elevated)] backdrop-blur-2xl border-r border-[var(--theme-border)] z-[400] flex-col justify-between transition-all duration-300 select-none ${
          isCollapsed ? "w-20 px-3 py-6" : "w-64 px-5 py-6"
        }`}
      >
        {/* Top: Logo & Collapse Button */}
        <div className="flex flex-col gap-6">
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
            <Link
              href="/"
              prefetch={false}
              onMouseEnter={() => handlePrefetch("/")}
              className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition duration-200 min-w-0"
              title={brandName}
            >
              <img src="/in.svg" alt={brandName} className="w-8 h-8 object-contain shrink-0 drop-shadow-md" />
              {!isCollapsed && (
                <span className="text-lg font-bold text-[var(--theme-fg)] tracking-tight font-display truncate">
                  {brandName}
                </span>
              )}
            </Link>

            {/* Toggle Button */}
            <button
              onClick={onToggleSidebar}
              className={`p-2 rounded-xl text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:bg-[var(--theme-card)] border border-transparent hover:border-[var(--theme-border)] transition-all cursor-pointer ${
                isCollapsed ? "hidden" : "block"
              }`}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={18} />
            </button>
          </div>

          {/* If collapsed, show small icon toggle button below logo */}
          {isCollapsed && (
            <div className="flex justify-center -mt-2">
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-xl text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:bg-[var(--theme-card)] border border-transparent hover:border-[var(--theme-border)] transition-all cursor-pointer"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen size={18} />
              </button>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1.5 mt-2">
            {NAV_ITEMS.map((item, idx) => {
              const isActive = activeSection === item.section;
              return (
                <Link
                  key={idx}
                  href={item.route}
                  prefetch={false}
                  onMouseEnter={() => handlePrefetch(item.route)}
                  onTouchStart={() => handlePrefetch(item.route)}
                  onClick={() => {
                    if (setSection) setSection(item.section);
                  }}
                  className={`group relative flex items-center rounded-2xl transition-all duration-200 border cursor-pointer select-none ${
                    isCollapsed 
                      ? "justify-center p-3" 
                      : "px-4 py-3 gap-3.5 text-xs font-bold uppercase tracking-wider"
                  } ${
                    isActive
                      ? "bg-[var(--theme-card)] text-[var(--theme-fg)] border-[var(--theme-border-active)] shadow-md shadow-[var(--theme-bg)]/20"
                      : "text-[var(--theme-muted)] hover:text-[var(--theme-fg)] hover:bg-[var(--theme-surface)] border-transparent"
                  }`}
                  title={item.label}
                >
                  <span className={`shrink-0 transition-colors ${
                    isActive ? "text-[var(--theme-accent)]" : "text-[var(--theme-muted)] group-hover:text-[var(--theme-fg)]"
                  }`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                  {isActive && !isCollapsed && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--theme-accent)] shadow-[0_0_6px_var(--theme-accent)] shrink-0" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions: GrooveLink trigger (on detail pages) & Theme Toggle */}
        <div className="flex flex-col gap-3 pt-4 border-t border-[var(--theme-border)]/50">
          {isDetailPage && (
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-groovelink'));
              }}
              className={`flex items-center rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)] text-[var(--theme-fg)] text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm active:scale-95 cursor-pointer ${
                isCollapsed ? "justify-center p-3" : "px-4 py-3 gap-3"
              }`}
              title="Open GrooveLink Modal"
            >
              <img src="/in.svg" alt="GrooveLink" className="w-4 h-4 object-contain shrink-0" />
              {!isCollapsed && <span className="truncate">GrooveLink</span>}
            </button>
          )}

          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className={`flex items-center rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-card)] text-[var(--theme-fg)] hover:border-[var(--theme-accent)] transition-all duration-300 cursor-pointer shadow-sm active:scale-95 ${
              isCollapsed ? "justify-center p-3" : "px-4 py-3 gap-3 text-xs font-bold uppercase tracking-wider"
            }`}
            title={`Current theme: ${theme === 'adaptive' ? 'Album-Adaptive' : isDark ? 'Dark' : 'Light'}. Click to cycle.`}
            aria-label="Toggle Theme"
          >
            {theme === 'adaptive' ? (
              <Sparkles size={17} className="text-[var(--theme-accent)] shrink-0" />
            ) : isDark ? (
              <Sun size={17} className="text-[var(--theme-accent)] shrink-0" />
            ) : (
              <Moon size={17} className="text-[var(--theme-accent)] shrink-0" />
            )}
            {!isCollapsed && (
              <span className="truncate">
                {theme === 'adaptive' ? 'Adaptive' : isDark ? 'Dark Mode' : 'Light Mode'}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Floating Mobile Bottom Navigation Bar with Liquid Glass & Fluid Animations */}
      <div className="lg:hidden fixed bottom-4 inset-x-4 max-w-md mx-auto z-[350]">
        <nav className="relative px-2 py-1.5 rounded-4xl bg-[var(--theme-surface-elevated)] backdrop-blur-2xl border border-[var(--theme-border)] shadow-2xl flex justify-around items-center select-none overflow-hidden transition-colors duration-300">
          {/* Liquid Glass Top Reflection */}
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[var(--theme-accent)]/30 to-transparent pointer-events-none" />

          {MOBILE_NAV_ITEMS.map((item, idx) => {
            const isActive = activeSection === item.section;
            return (
              <Link
                key={idx}
                href={item.route}
                prefetch={false}
                onMouseEnter={() => handlePrefetch(item.route)}
                onTouchStart={() => handlePrefetch(item.route)}
                onPointerDown={() => {
                  if (setSection) setSection(item.section);
                }}
                className="relative flex-1 py-1.5 px-1 flex flex-col justify-center items-center gap-1 transition-colors duration-200 cursor-pointer select-none"
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
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default AppBar;
