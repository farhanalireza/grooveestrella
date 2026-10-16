// src/Components/GrooveLoader.jsx
"use client";

import React from "react";

export default function GrooveLoader({ size = 36, text = null, className = "", fullScreen = false }) {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3.5 select-none ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Ambient colored blur glow */}
        <div 
          className="absolute rounded-full bg-gradient-to-tr from-[var(--theme-accent)]/40 to-[var(--theme-plum)]/30 blur-lg animate-pulse pointer-events-none"
          style={{ width: size * 1.4, height: size * 1.4 }}
        />
        
        {/* Circling in.svg spinning logo */}
        <img
          src="/in.svg"
          alt="Groove Loading..."
          className="animate-spin object-contain pointer-events-none drop-shadow-[0_0_15px_var(--theme-border-active)] transition-transform"
          style={{ 
            width: size, 
            height: size, 
            animationDuration: "1.15s",
            animationTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)"
          }}
        />
      </div>

      {text && (
        <span className="text-xs font-bold text-[var(--theme-muted)] tracking-widest uppercase animate-pulse">
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] w-full bg-[var(--theme-bg)] text-[var(--theme-fg)] p-6">
        {content}
      </div>
    );
  }

  return content;
}
