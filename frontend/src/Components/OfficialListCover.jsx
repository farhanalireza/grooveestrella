// src/Components/OfficialListCover.jsx
"use client";

import React from "react";
import { Disc3 } from "lucide-react";

const FALLBACK_SVG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%2317020B'/%3E%3Ccircle cx='50' cy='50' r='32' fill='%23300818' stroke='%23E8A87C' stroke-width='2'/%3E%3C/svg%3E";

export default function OfficialListCover({
  coverImageUrl = null,
  previewCovers = [],
  title = "Official List",
  className = "w-full aspect-square rounded-2xl",
}) {
  if (coverImageUrl) {
    return (
      <div className={`overflow-hidden bg-black/40 border border-white/10 ${className}`}>
        <img
          src={coverImageUrl}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_SVG;
          }}
        />
      </div>
    );
  }

  const covers = Array.isArray(previewCovers) ? previewCovers.filter(Boolean).slice(0, 4) : [];

  if (covers.length >= 4) {
    return (
      <div
        className={`overflow-hidden bg-black/40 border border-white/10 grid grid-cols-2 grid-rows-2 gap-0.5 ${className}`}
      >
        {covers.map((src, idx) => (
          <img
            key={idx}
            src={src}
            alt={`${title} cover ${idx + 1}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = FALLBACK_SVG;
            }}
          />
        ))}
      </div>
    );
  }

  if (covers.length > 0) {
    return (
      <div className={`overflow-hidden bg-black/40 border border-white/10 ${className}`}>
        <img
          src={covers[0]}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_SVG;
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden bg-gradient-to-br from-[#300818] via-[#17020B] to-[#260714] border border-amber-400/20 flex items-center justify-center ${className}`}
    >
      <Disc3 size={36} className="text-amber-300/70" />
    </div>
  );
}
