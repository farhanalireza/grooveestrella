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
} from "lucide-react";
import { motion } from "framer-motion";

const AppBar = ({ selectedSection, setSection }) => {
  const router = useRouter();
  const pathname = usePathname();

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

  const isSharePage = pathname?.startsWith("/s/");
  const brandName = isSharePage ? "GrooveLink" : "GrooveEstrella";

  return (
    <>
      {/* Desktop Top Header Navigation Bar */}
      <div className="hidden lg:block fixed top-0 left-0 right-0 bg-[#07090F]/90 backdrop-blur-md border-b border-white/10 z-[400] h-16">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-full">
          
          {/* Logo & Brand Name */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition duration-200" 
            onClick={() => router.push("/")}
          >
            <img src="/in.svg" alt={brandName} className="w-8 h-8 object-contain" />
            <span className="text-lg font-bold text-white tracking-tight font-display">{brandName}</span>
          </div>

          {/* Desktop Nav Items */}
          <nav className="flex items-center gap-2">
            {navItems.map((item, idx) => {
              const isActive = selectedSection === item.section;
              return (
                <button
                  key={idx}
                  onClick={() => handleNavClick(item)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-4xl transition-all duration-300 border ${
                    isActive
                      ? "bg-[#870087]/25 text-[#F0ABFC] border-[#C026D3]/35 shadow-md shadow-[#870087]/15"
                      : "text-zinc-400 hover:text-white hover:bg-white/5 border-transparent"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

        </div>
      </div>

      {/* Floating Mobile Bottom Navigation Bar with Liquid Glass & Fluid Animations */}
      <div className="lg:hidden fixed bottom-4 inset-x-4 max-w-md mx-auto z-[350]">
        <nav className="relative px-2 py-1.5 rounded-4xl bg-[#0D121F]/80 backdrop-blur-2xl border border-white/[0.12] shadow-[0_16px_40px_rgba(0,0,0,0.65),0_0_1px_1px_rgba(255,255,255,0.08)] flex justify-around items-center select-none overflow-hidden">
          {/* Liquid Glass Top Reflection */}
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

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
                    className="absolute inset-1 rounded-4xl bg-gradient-to-b from-[#870087]/50 to-[#C026D3]/20 border border-[#E879F9]/40 shadow-[0_0_16px_rgba(135,0,135,0.45)] -z-0 w-full h-full top-0 left-0"
                  />
                )}

                {/* Animated Icon */}
                <motion.div
                  animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className={`relative z-10 transition-colors duration-200 ${
                    isActive ? "text-[#F0ABFC] drop-shadow-[0_0_8px_rgba(232,121,249,0.7)]" : "text-[#8992A5]"
                  }`}
                >
                  {item.icon}
                </motion.div>

                {/* Text Label */}
                <span className={`relative z-10 text-[9px] font-bold tracking-wider uppercase leading-none transition-colors duration-200 ${
                  isActive ? "text-white font-extrabold" : "text-[#8992A5]/70"
                }`}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </nav>
      </div>
    </>
  );
};

export default AppBar;