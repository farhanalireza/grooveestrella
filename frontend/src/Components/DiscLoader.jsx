// src/Components/DiscLoader.jsx
"use client";

import React from "react";

/**
 * Universal GrooveEstrella Disc Loader
 * Replaces generic CSS circular spinners with the spinning app logo vinyl disc.
 */
export default function DiscLoader({ size = 20, className = "" }) {
  const pixelSize = typeof size === "number" ? `${size}px` : size;

  return (
    <img
      src="/in.svg"
      alt="Loading..."
      className={`animate-spin object-contain select-none pointer-events-none drop-shadow-[0_0_8px_rgba(232,168,124,0.35)] shrink-0 ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
      }}
    />
  );
}
