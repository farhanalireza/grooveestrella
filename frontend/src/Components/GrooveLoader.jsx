// src/Components/GrooveLoader.jsx
"use client";

import React from "react";

export default function GrooveLoader({ 
  size = 64, 
  text = null, 
  className = "", 
  fullScreen = false 
}) {
  // Strip out any legacy "Loading Groove" text
  const cleanText = text && !text.toLowerCase().includes("loading groove") ? text : null;

  const loaderContent = (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Liquid Fluid Background Aura */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing Liquid Color Blob 1 */}
        <div 
          className="absolute rounded-full bg-gradient-to-tr from-[var(--theme-accent)]/45 via-[#E8A87C]/25 to-[var(--theme-plum)]/40 blur-2xl animate-pulse pointer-events-none"
          style={{ 
            width: size * 2.2, 
            height: size * 2.2,
            animationDuration: "3s" 
          }}
        />

        {/* Morphing Liquid Color Blob 2 */}
        <div 
          className="absolute rounded-full bg-gradient-to-br from-[#FF9E7D]/30 via-transparent to-[var(--theme-accent)]/25 blur-xl pointer-events-none animate-spin"
          style={{ 
            width: size * 1.8, 
            height: size * 1.8,
            animationDuration: "8s" 
          }}
        />

        {/* Liquid Glassmorphic Disc Housing Container */}
        <div 
          className="relative flex items-center justify-center rounded-full bg-black/40 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.3)] transition-transform duration-300"
          style={{ 
            width: size * 1.45, 
            height: size * 1.45,
            padding: Math.max(8, size * 0.16)
          }}
        >
          {/* Subtle Concentric Vinyl Groove Rings */}
          <div className="absolute inset-1.5 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute inset-3 rounded-full border border-white/5 pointer-events-none" />

          {/* Liquid Specular Light Reflection Sweep */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/15 via-transparent to-transparent pointer-events-none" />

          {/* Spinning Enlarged Vinyl Record Logo */}
          <img
            src="/in.svg"
            alt="Groove Disc Loading"
            className="animate-spin object-contain pointer-events-none drop-shadow-[0_0_20px_var(--theme-accent)] relative z-10"
            style={{ 
              width: size, 
              height: size, 
              animationDuration: "1.4s",
              animationTimingFunction: "linear"
            }}
          />

          {/* Center Glowing Spindle Dot */}
          <div className="absolute z-20 w-2.5 h-2.5 rounded-full bg-[var(--theme-accent)] shadow-[0_0_8px_var(--theme-accent)] pointer-events-none" />
        </div>
      </div>

      {cleanText && (
        <span className="mt-4 text-xs font-semibold text-[var(--theme-fg)]/75 tracking-wider uppercase animate-pulse">
          {cleanText}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-[65vh] w-full bg-[var(--theme-bg)] text-[var(--theme-fg)] p-6 overflow-hidden">
        {/* Full-screen liquid backdrop gradients */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[var(--theme-plum)]/30 blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[var(--theme-accent)]/15 blur-3xl pointer-events-none" />
        </div>
        <div className="relative z-10">
          {loaderContent}
        </div>
      </div>
    );
  }

  return loaderContent;
}
